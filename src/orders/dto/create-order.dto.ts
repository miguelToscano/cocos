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
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { OrderSide } from "../../orders/domain/enums/order-side.enum";
import { OrderType } from "../../orders/domain/enums/order-type.enum";

@ValidatorConstraint({ name: "onlyOne", async: false })
export class OnlyOneDefined implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    return (
      (obj.size !== undefined && obj.totalInvestment === undefined) ||
      (obj.size === undefined && obj.totalInvestment !== undefined)
    );
  }
  defaultMessage(args: ValidationArguments) {
    return "You must provide either size or totalInvestment, but not both.";
  }
}

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
  @IsPositive()
  @ValidateIf(
    (o) =>
      o.type === OrderType.LIMIT
  )
  price?: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.totalInvestment === undefined)
  size?: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.size === undefined)
  totalInvestment?: number;

  @Validate(OnlyOneDefined)
  private onlyOne?: any;
}
