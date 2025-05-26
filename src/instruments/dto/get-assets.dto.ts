import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";
import { Instrument } from "../domain/entities/instrument.entity";
import { Type } from "class-transformer";

export class GetInstrumentsRequestDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  limit?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
export class GetInstrumentsResponseDto {
  assets: Instrument[];
  count: number;
}
