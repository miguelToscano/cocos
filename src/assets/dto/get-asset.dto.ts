import { IsInt } from "class-validator";
import { Asset } from "../domain/entities/asset.entity";
import { Type } from "class-transformer";

export class GetAssetRequestDto {
  @Type(() => Number)
  @IsInt()
  id: number;
}
export class GetAssetResponseDto {
  asset: Asset | null;
}
