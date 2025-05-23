import { Injectable } from "@nestjs/common";
import { AssetsRepository } from "./assets.repository";
import { Asset } from "./domain/entities/asset.entity";
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "./domain/constants/pagination.constant";

@Injectable()
export class AssetsService {
  constructor(private readonly assetsRepository: AssetsRepository) {}

  async getAssets({
    search,
    limit = DEFAULT_LIMIT,
    offset = DEFAULT_OFFSET,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const assets = search
      ? await this.assetsRepository.searchAssets({
          search,
          limit,
          offset,
        })
      : await this.assetsRepository.getAssets({
          limit,
          offset,
        });

    return assets;
  }

  async getAsset(id: number) {
    const asset = await this.assetsRepository.getAsset(id);
    return {
      asset,
    };
  }
}
