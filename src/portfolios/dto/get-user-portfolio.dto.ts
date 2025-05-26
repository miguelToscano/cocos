import { Type } from "class-transformer";
import { IsPositive, IsInt } from "class-validator";

export class GetUserPortfolioRequestDto {
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    id: number;
};