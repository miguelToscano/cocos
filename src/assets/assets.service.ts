import { Injectable, NotFoundException } from "@nestjs/common";
import { AssetsRepository } from "./assets.repository";
import { Asset } from "./domain/entities/asset.entity";
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "./domain/constants/pagination.constant";

@Injectable()
export class AssetsService {
  constructor(private readonly assetsRepository: AssetsRepository) {}

  /**
   * Retrieves a list of assets with optional search, pagination, and count.
   *
   * @param params - The parameters for retrieving assets.
   * @param params.search - Optional search string to filter assets.
   * @param params.limit - Optional maximum number of assets to return. Defaults to `DEFAULT_LIMIT`.
   * @param params.offset - Optional number of assets to skip for pagination. Defaults to `DEFAULT_OFFSET`.
   * @returns A promise that resolves to an object containing the array of assets and the total count.
   */
  async getAssets({
    search,
    limit = DEFAULT_LIMIT,
    offset = DEFAULT_OFFSET,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ assets: Asset[]; count: number }> {
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

  /**
   * Retrieves an asset by its unique identifier.
   *
   * @param id - The unique identifier of the asset to retrieve.
   * @returns A promise that resolves to the requested {@link Asset}.
   * @throws NotFoundException If no asset with the specified id is found.
   */
  async getAsset(id: number): Promise<Asset> {
    const asset = await this.assetsRepository.getAsset(id);

    if (!asset) {
      throw new NotFoundException(`Asset with id: ${id} not found`);
    }

    return asset;
  }
}
