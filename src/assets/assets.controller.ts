import { Controller, Get, Param, Query } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import { GetAssetsResponseDto } from "./dto/get-assets.dto";
import { GetAssetResponseDto } from "./dto/get-asset.dto";

@Controller("assets")
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  getAssets(@Query("search") search?: string): Promise<GetAssetsResponseDto> {
    return search
      ? this.assetsService.searchAssets(search)
      : this.assetsService.getAssets();
  }

  @Get(":id")
  findOne(@Param("id") id: number): Promise<GetAssetResponseDto> {
    return this.assetsService.getAsset(id);
  }
}
