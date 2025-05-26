import { OrderSide } from "../enums/order-side.enum";
import { OrderStatus } from "../enums/order-status.enum";
import { OrderType } from "../enums/order-type.enum";

export class Order {
  id: number;
  instrumentId: number;
  userId: number;
  size: number;
  price: number;
  type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  datetime: Date;
}
