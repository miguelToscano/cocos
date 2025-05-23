import { Injectable } from "@nestjs/common";
import { GetAssetResponseDto } from "./dto/get-asset.dto";
import {
  GetAssetsRequestDto,
  GetAssetsResponseDto,
} from "./dto/get-assets.dto";
import { AssetsRepository } from "./assets.repository";
import { Asset } from "./domain/entities/asset.entity";
import { GetAssetRequestDto } from "./dto/get-asset.dto";

@Injectable()
export class AssetsService {
  constructor(private readonly assetsRepository: AssetsRepository) {}

  async getAssets({
    search,
  }: {
    search?: string;
  }): Promise<GetAssetsResponseDto> {
    const assets = search
      ? await this.assetsRepository.searchAssets(search)
      : await this.assetsRepository.getAssets();

    return {
      assets: assets as Asset[],
      count: 10,
    };
  }

  async searchAssets(search: string): Promise<GetAssetsResponseDto> {
    const assets = await this.assetsRepository.searchAssets(search);

    return {
      assets,
      count: assets.length,
    };
  }

  async getAsset(params: GetAssetRequestDto): Promise<GetAssetResponseDto> {
    const asset = await this.assetsRepository.getAsset(params.id);
    return {
      asset,
    };
  }
}
