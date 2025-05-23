import { Sequelize } from "sequelize-typescript";
import { Asset } from "./domain/entities/asset.entity";
import { Injectable } from "@nestjs/common";
import { QueryTypes } from "sequelize";

@Injectable()
export class AssetsRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async getAssets({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<{ assets: Asset[]; count: number }> {
    const result = await this.sequelize.query<(Asset & { count: number })>(
      `
        WITH matches AS (
            SELECT 
              id,
              ticker,
              name,
              type,
              COUNT(*) OVER()
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

    console.log(result)

    return {
      assets: result as Asset[],
      count: result[0]?.count ?? 0
    };
  }

  async searchAssets({
    search,
    limit,
    offset,
  }: {
    search: string;
    limit: number;
    offset: number;
  }): Promise<{ assets: Asset[]; count: number }> {
    const result = await this.sequelize.query<Asset & { count: number }>(
      `
          WITH matches AS (
            SELECT 
              id,
              ticker,
              name,
              type,
              COUNT(*) OVER()
            FROM instruments i 
            WHERE i.name ILIKE :search
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
          search: `%${search}%`,
          limit,
          offset,
        },
      },
    );

    return {
      assets: result as Asset[],
      count: result[0]?.count ?? 0,
    };
  }

  async getAsset(id: number): Promise<Asset | null> {
    const [asset] = await this.sequelize.query(
      `
        SELECT 
          id,
          ticker,
          name,
          type
        FROM instruments i
        WHERE i.id = :id
      `,
      {
        replacements: {
          id,
        },
      },
    );

    console.log(asset);

    return asset as unknown as Asset;
  }
}
