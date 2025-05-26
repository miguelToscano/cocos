import { Sequelize } from "sequelize-typescript";
import { Instrument } from "./domain/entities/instrument.entity";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { QueryTypes } from "sequelize";

@Injectable()
export class InstrumentsRepository {
  constructor(private readonly sequelize: Sequelize) {}

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
  }): Promise<{ assets: Instrument[]; count: number }> {
    const assets = await this.sequelize.query<Instrument & { count: number }>(
      `
        WITH matches AS (
            SELECT 
              id,
              ticker,
              name,
              type,
              COUNT(i.id) OVER()
            FROM instruments i 
            ORDER BY name ASC
          )
        SELECT *
        FROM matches
        LIMIT :limit
        OFFSET :offset
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          limit,
          offset,
        },
      },
    );

    return {
      assets: assets as Instrument[],
      count: assets[0]?.count ?? 0,
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
  async searchInstruments({
    search,
    limit,
    offset,
  }: {
    search: string;
    limit: number;
    offset: number;
  }): Promise<{ assets: Instrument[]; count: number }> {
    try {
      const assets = await this.sequelize.query<Instrument & { count: number }>(
        `
            set pg_trgm.similarity_threshold = 0.1;
            WITH strict_matches AS (
              SELECT 
                id,
                ticker,
                name,
                type,
                1 AS similarity,
                COUNT(*) OVER()
              FROM instruments i 
              WHERE i.name ILIKE :search
                OR i.ticker ILIKE :search
            ), fuzzy_matches as (
              select id,
              ticker,
              name,
              type,
              similarity(i.ticker, :search) as similarity,
              COUNT(*) OVER()
              from instruments i
              where i.ticker % :search
            ), results_union AS (
              SELECT *
              FROM strict_matches
              UNION
              SELECT *
              FROM fuzzy_matches
              ORDER BY similarity DESC, name ASC
            )
            SELECT 
              DISTINCT ON (id)
              *
            FROM results_union ru
            LIMIT :limit
            OFFSET :offset
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            search: `%${search}%`,
            limit,
            offset,
          },
        },
      );

      return {
        assets: assets as Instrument[],
        count: assets[0]?.count ?? 0,
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
  async getInstrument(id: number): Promise<Instrument> {
    try {
      const asset = await this.sequelize.query<Instrument>(
        `
          SELECT 
            id,
            ticker,
            name,
            type,
            close,
            latest_value.close,
            latest_value.previous_close as "previousClose"
          FROM instruments i
          LEFT JOIN LATERAL (
            SELECT 
              close,
              previous_close
            FROM marketdata m
            WHERE m.instrument_id = i.id
            ORDER BY date DESC
            LIMIT 1
          ) as latest_value ON TRUE
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

      return asset as unknown as Instrument;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
