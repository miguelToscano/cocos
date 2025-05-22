import { Sequelize } from "sequelize-typescript";
import { Asset } from "./entities/asset.entity";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AssetsRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async getAssets(): Promise<Asset[]> {
    const [assets] = await this.sequelize.query(`
        SELECT 
          id,
          ticker,
          name,
          type
        FROM instruments i
        limit 10
      `);

    return assets as Asset[];
  }

  async searchAssets(search: string): Promise<Asset[]> {
    return [];
  }

  async getAsset(id: number): Promise<Asset | null> {
    return null;
  }
}
