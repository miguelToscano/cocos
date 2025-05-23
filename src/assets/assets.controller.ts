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
  getAssets(
    @Query() query: GetAssetsRequestDto,
  ): Promise<GetAssetsResponseDto> {
    return this.assetsService.getAssets({
      search: query.search,
    });
  }

  @Get("/:id")
  getAsset(@Param() params: GetAssetRequestDto): Promise<GetAssetResponseDto> {
    return this.assetsService.getAsset(params);
  }
}
