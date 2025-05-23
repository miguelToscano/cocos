import { Injectable } from "@nestjs/common";
import { AssetsRepository } from "./assets.repository";
import { Asset } from "./domain/entities/asset.entity";
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "./domain/constants/pagination.constant";
import { z } from "zod";

const GetAssetsParamsSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).optional(),
  offset: z.number().min(0).optional(),
});

type GetAssetsParamsType = z.infer<typeof GetAssetsParamsSchema>;

const GetAssetParamsSchema = z.object({
  id: z.number(),
});

type GetAssetParamsType = z.infer<typeof GetAssetParamsSchema>;
@Injectable()
export class AssetsService {
  constructor(private readonly assetsRepository: AssetsRepository) {}

  async getAssets(params: GetAssetsParamsType) {
    const parsedParams = GetAssetsParamsSchema.parse(params);

    parsedParams.limit = parsedParams.limit ?? DEFAULT_LIMIT;
    parsedParams.offset = parsedParams.offset ?? DEFAULT_OFFSET;

    const assets = parsedParams.search
      ? await this.assetsRepository.searchAssets({
          search: parsedParams.search,
          limit: parsedParams.limit,
          offset: parsedParams.offset,
        })
      : await this.assetsRepository.getAssets({
          limit: parsedParams.limit,
          offset: parsedParams.offset,
        });

    return {
      assets: assets as Asset[],
      count: assets.length,
    };
  }

  async getAsset(params: GetAssetParamsType) {
    const parsedParams = GetAssetParamsSchema.parse(params);

    const asset = await this.assetsRepository.getAsset(parsedParams.id);
    return {
      asset,
    };
  }
}
