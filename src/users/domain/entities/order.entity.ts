import { OrderSide } from "../enums/order-side.enum";
import { OrderStatus } from "../enums/order-status.enum";
import { OrderType } from "../enums/order-type.enum";

export class Order {
  id: number;
  instrumentId: number;
  userId: number;
  size: number;
  price: number;
  side: OrderSide;
  status: OrderStatus;
  datetime: Date;
}

export class MarketOrder extends Order {
  type: OrderType.MARKET;
}

export class LimitOrder extends Order {
  type: OrderType.LIMIT;
}
