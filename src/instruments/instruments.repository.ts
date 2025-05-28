import { Sequelize } from "sequelize-typescript";
import { Instrument } from "./domain/entities/instrument.entity";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { QueryTypes } from "sequelize";
import { InstrumentWithPrice } from "./domain/aggregates/instrument-price";
import { InstrumentType } from "./domain/enums/instrument-type.enum";
import { z } from "zod";

@Injectable()
export class InstrumentsRepository {
  constructor(private readonly database: Sequelize) {}

  /**
   * Retrieves a paginated list of assets from the instruments table.
   *
   * @param params - The pagination parameters.
   * @param params.limit - The maximum number of assets to return.
   * @param params.offset - The number of assets to skip.
   * @returns An object containing the array of assets and the total count.
   */
  async getInstruments({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<{ instruments: Instrument[]; count: number }> {
    const result = await this.database.query<{
      instruments: Instrument[];
      count: number;
    }>(
      `
        WITH matches AS (
              SELECT 
                id,
                ticker,
                name,
                type,
                COUNT(i.id) OVER() as count
              FROM instruments i 
              LIMIT :limit
              OFFSET :offset
        )
        SELECT 
          JSONB_AGG(JSONB_BUILD_OBJECT(
              'id', m.id,
              'ticker', m.ticker,
              'name', m.name,
              'type', m.type
            ) ORDER BY ticker ASC, name ASC
          ) as instruments,
          MAX(count)::int AS count
        FROM matches m
      `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          limit,
          offset,
        },
      },
    );

    return {
      instruments: result?.instruments ?? ([] as Instrument[]),
      count: result?.count ?? 0,
    };
  }

  /**
   * Searches for assets by name using a case-insensitive match, with pagination.
   *
   * @param params - The search and pagination parameters.
   * @param params.search - The search string to filter asset names.
   * @param params.limit - The maximum number of assets to return.
   * @param params.offset - The number of assets to skip.
   * @returns An object containing the array of matching assets and the total count.
   */
  async searchInstruments(parameters: {
    search: string;
    limit: number;
    offset: number;
  }): Promise<{ instruments: Instrument[]; count: number }> {
    try {
      const result = await this.database.query<{
        instruments: Instrument[];
        count: number;
      }>(
        `
            WITH matches AS (
              SELECT 
                id,
                ticker,
                name,
                type,
                COUNT(i.id) OVER() as count
              FROM instruments i 
              WHERE 
                ticker = :search
                OR name = :search
                OR textsearchable_trgm_index_col ILIKE :fuzzySearch
                OR textsearchable_index_col @@ to_tsquery(:tsQuerySearch)
              ORDER BY ticker ASC, name ASC
              LIMIT :limit
              OFFSET :offset
            )
            SELECT 
              JSONB_AGG(JSONB_BUILD_OBJECT(
                  'id', m.id,
                  'ticker', m.ticker,
                  'name', m.name,
                  'type', m.type
                ) ORDER BY ticker ASC, name ASC
              ) as instruments,
              MAX(count)::int as count
            FROM matches m
            
        `,
        {
          type: QueryTypes.SELECT,
          plain: true,
          replacements: {
            search: parameters.search,
            fuzzySearch: `%${parameters.search.split(" ").join("%")}%`,
            tsQuerySearch: `${parameters.search.split(" ").join(" & ")}`,
            limit: parameters.limit,
            offset: parameters.offset,
          },
        },
      );

      return {
        instruments: (result?.instruments ?? []) as Instrument[],
        count: result?.count ?? 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Retrieves a single asset by its unique identifier.
   *
   * @param id - The unique identifier of the asset.
   * @returns The asset if found, otherwise null.
   */
  async getInstrumentWithPrice(id: number): Promise<InstrumentWithPrice> {
    try {
      const instrument = await this.database.query<InstrumentWithPrice>(
        `
          SELECT 
            id,
            ticker,
            name,
            type,
            close,
            COALESCE(latest_value.close, 1) AS close,
            COALESCE(latest_value.previous_close, 1) AS "previousClose"
          FROM instruments i
          LEFT JOIN LATERAL (
            SELECT 
              close,
              previous_close
            FROM marketdata m
            WHERE m.instrument_id = i.id
            ORDER BY date DESC
            LIMIT 1
          ) as latest_value ON i.type = '${InstrumentType.ACCIONES}'
          WHERE i.id = :id
        `,
        {
          type: QueryTypes.SELECT,
          plain: true,
          replacements: {
            id,
          },
        },
      );

      return {
        ...instrument,
        close: parseFloat(String(instrument?.close ?? 0)),
        previousClose: parseFloat(String(instrument?.previousClose ?? 0)),
      } as InstrumentWithPrice;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
