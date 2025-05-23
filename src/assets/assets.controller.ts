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
    const response = await this.assetsService.getAssets({
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    });

    return response;
  }

  @Get("/:id")
  async getAsset(
    @Param() params: GetAssetRequestDto,
  ): Promise<GetAssetResponseDto> {
    const response = this.assetsService.getAsset({
      id: params.id,
    });
    return response;
  }
}
