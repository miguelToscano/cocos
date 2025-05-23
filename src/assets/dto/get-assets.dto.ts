import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Asset } from "../domain/entities/asset.entity";
import { Type } from "class-transformer";

export class GetAssetsRequestDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  offset?: number;
}
export class GetAssetsResponseDto {
  assets: Asset[];
  count: number;
}
