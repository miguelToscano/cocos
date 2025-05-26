import { IsInt, IsPositive } from "class-validator";
import { Instrument } from "../domain/entities/instrument.entity";
import { Type } from "class-transformer";

export class GetInstrumentRequestDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id: number;
}
export class GetInstrumentResponseDto {
  asset: Instrument | null;
}
