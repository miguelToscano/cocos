import { Sequelize } from "sequelize-typescript";
import { Instrument } from "./domain/entities/instrument.entity";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { QueryTypes } from "sequelize";
import { InstrumentWithPrice } from "./domain/aggregates/instrument-price";
import { InstrumentType } from "./domain/enums/instrument-type.enum";

@Injectable()
export class InstrumentsRepository {
  constructor(private readonly database: Sequelize) {}

  /**
   * Retrieves a paginated list of instruments from the database along with the total count.
   *
   * @param params - An object containing pagination parameters.
   * @param params.limit - The maximum number of instruments to retrieve.
   * @param params.offset - The number of instruments to skip before starting to collect the result set.
   * @returns A promise that resolves to an object containing:
   *   - `instruments`: An array of `Instrument` objects.
   *   - `count`: The total number of instruments available.
   * @throws {InternalServerErrorException} If a database error occurs.
   */
  async getInstruments({
    limit,
    offset,
  }: {
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
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Searches for instruments in the database based on the provided parameters.
   *
   * This method performs a search using exact matches on the `ticker` and `name` fields,
   * as well as fuzzy and full-text search on indexed columns. Results are paginated
   * using the specified `limit` and `offset` values.
   *
   * @param parameters - The search parameters.
   * @param parameters.search - The search string to match against instrument fields.
   * @param parameters.limit - The maximum number of instruments to return.
   * @param parameters.offset - The number of instruments to skip before starting to collect the result set.
   * @returns An object containing the list of matching instruments and the total count.
   * @throws {InternalServerErrorException} If a database error occurs during the search.
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
                OR (ticker || ' ' || name) ILIKE :fuzzySearch
                OR to_tsvector(ticker || ' ' || name) @@ to_tsquery(:tsQuerySearch)
                OR to_tsvector(name) @@ to_tsquery(:tsQuerySearch)
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
   * Retrieves an instrument by its ID along with its latest price information.
   *
   * Executes a SQL query to fetch the instrument's details and its most recent market data,
   * including the latest close and previous close prices. If no market data is available,
   * default values are used. The method returns the instrument data with price fields
   * parsed as floating-point numbers.
   *
   * @param id - The unique identifier of the instrument to retrieve.
   * @returns A promise that resolves to an `InstrumentWithPrice` object containing the instrument's details and price information.
   * @throws {InternalServerErrorException} If an error occurs during the database query.
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
