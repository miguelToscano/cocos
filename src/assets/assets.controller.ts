import { Controller, Get, Param, Query } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import {
  GetAssetsRequestDto,
  GetAssetsResponseDto,
} from "./dto/get-assets.dto";
import { GetAssetRequestDto, GetAssetResponseDto } from "./dto/get-asset.dto";

@Controller("assets")
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async getAssets(
    @Query() query: GetAssetsRequestDto,
  ): Promise<GetAssetsResponseDto> {
    const assets = await this.assetsService.getAssets({
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    });

    return assets;
  }

  @Get("/:id")
  async getAsset(
    @Param() params: GetAssetRequestDto,
  ): Promise<GetAssetResponseDto> {
    const asset = await this.assetsService.getAsset(params.id);

    return {
      asset,
    };
  }
}
