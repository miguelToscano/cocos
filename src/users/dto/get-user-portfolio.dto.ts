import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";
import { Portfolio } from "../domain/aggregates/portfolio-aggregate";

export class GetUserPortfolioRequestDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  id: number;
}

export class GetUserPortfolioResponseDto extends Portfolio {}
