import { Type } from "class-transformer";
import { IsPositive, IsInt } from "class-validator";

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  assetId: string;
}
