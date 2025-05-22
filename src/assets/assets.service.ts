import { Injectable } from "@nestjs/common";
import { GetAssetsResponseDto } from "./dto/get-assets.dto";
import { GetAssetResponseDto } from "./dto/get-asset.dto";
import { AssetsRepository } from "./assets.repository";

@Injectable()
export class AssetsService {
  constructor(private readonly assetsRepository: AssetsRepository) {}

  async getAssets(): Promise<GetAssetsResponseDto> {
    const assets = await this.assetsRepository.getAssets();

    return {
      assets,
      count: assets.length,
    };
  }

  async searchAssets(search: string): Promise<GetAssetsResponseDto> {
    const assets = await this.assetsRepository.searchAssets(search);

    return {
      assets,
      count: assets.length,
    };
  }

  async getAsset(id: number): Promise<GetAssetResponseDto> {
    const asset = await this.assetsRepository.getAsset(id);
    return {
      asset,
    };
  }
}
