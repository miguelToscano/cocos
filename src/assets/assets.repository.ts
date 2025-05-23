import { Sequelize } from "sequelize-typescript";
import { Asset } from "./domain/entities/asset.entity";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AssetsRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async getAssets({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<Asset[]> {
    const [assets] = await this.sequelize.query(
      `
        SELECT 
          id,
          ticker,
          name,
          type
        FROM instruments i
        ORDER BY i.name ASC
        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          limit,
          offset,
        },
      },
    );

    return assets as Asset[];
  }

  async searchAssets({
    search,
    limit,
    offset,
  }: {
    search: string;
    limit: number;
    offset: number;
  }): Promise<Asset[]> {
    const [assets] = await this.sequelize.query(
      `
        SELECT 
          id,
          ticker,
          name,
          type
        FROM instruments i
        where 
          :search < i.name
          and word_similarity(i.name, :search) > 0.10
        order by 
          word_similarity(i.name, :search) desc,
          i.name asc
        limit :limit
        offset :offset
      `,
      {
        replacements: {
          search,
          limit,
          offset,
        },
      },
    );

    return assets as Asset[];
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
