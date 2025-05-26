import { Type } from "class-transformer";
import {
  IsPositive,
  IsInt,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  ValidateIf,
} from "class-validator";
import { OrderSide } from "../../orders/domain/enums/order-side.enum";
import { OrderType } from "../../orders/domain/enums/order-type.enum";
import { Order } from "../../orders/domain/entities/order.entity";

export class CreateOrderRequestDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  instrumentId: number;

  @IsString()
  @IsEnum(OrderSide)
  side: OrderSide;

  @IsString()
  @IsEnum(OrderType)
  type: OrderType;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsPositive()
  size: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.type === OrderType.LIMIT)
  @IsOptional()
  price: number;
}

export class CreateOrderResponseDto extends Order {}
