import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { Order } from "./domain/entities/order.entity";
import { QueryTypes } from "sequelize";
import { PickType } from "@nestjs/mapped-types";
import { OrderType } from "./domain/enums/order-type.enum";
import { OrderSide } from "./domain/enums/order-side.enum";
import { OrderStatus } from "./domain/enums/order-status.enum";

export type CreateOrderParameters = Pick<
  Order,
  "instrumentId" | "size" | "userId"
>;

export type CreateCashInOrderParameters = Pick<
  Order,
  "instrumentId" | "size" | "userId"
>;

export type CreateCashOutOrderParameters = Pick<
  Order,
  "instrumentId" | "size" | "userId" | "status"
>;

@Injectable()
export class OrdersRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async createCashInOrder(
    parameters: CreateCashInOrderParameters,
  ): Promise<Order> {
    console.log(parameters.size);
    const createdOrder = await this.sequelize.query<Order>(
      `
        INSERT INTO orders (instrument_id, user_id, size, price, type, side, status)
        VALUES (:instrumentId, :userId, :size, 1, '${OrderType.MARKET}', '${OrderSide.CASH_IN}', '${OrderStatus.FILLED}')
        RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          instrumentId: parameters.instrumentId,
          userId: parameters.userId,
          size: parameters.size,
        },
      },
    );

    return createdOrder as Order;
  }

  async createCashOutOrder(
    parameters: CreateCashOutOrderParameters,
  ): Promise<Order> {
    const createdOrder = await this.sequelize.query<Order>(
      `
        INSERT INTO orders (instrument_id, user_id, size, price, type, side, status)
        VALUES (:instrumentId, :userId, :size, 1, '${OrderType.MARKET}', '${OrderSide.CASH_OUT}', :status)
        RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          instrumentId: parameters.instrumentId,
          userId: parameters.userId,
          size: parameters.size,
          status: parameters.status,
        },
      },
    );

    return createdOrder as Order;
  }

  async createBuyMarketOrder() {}

  async createSellMarketOrder() {}

  async createBuyOrder(
    parameters: CreateOrderParameters & { price: number },
  ): Promise<Order> {
    const createdOrder = await this.sequelize.query<Order>(
      `
        INSERT INTO orders (instrument_id, user_id, size, price, type, side, status)
        VALUES (:instrumentId, :userId, :size, :price, :type, :side, :status)
        RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          instrumentId: parameters.instrumentId,
          userId: parameters.userId,
          size: parameters.size,
          price: parameters.price,
          type: OrderType.LIMIT,
          side: OrderSide.BUY,
          status: OrderStatus.NEW,
        },
      },
    );

    return createdOrder as Order;
  }
  async createSellOrder(
    parameters: CreateOrderParameters & { price: number },
  ): Promise<Order> {
    const createdOrder = await this.sequelize.query<Order>(
      `
        INSERT INTO orders (instrument_id, user_id, size, price, type, side, status)
        VALUES (:instrumentId, :userId, :size, :price, :type, :side, :status)
        RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          instrumentId: parameters.instrumentId,
          userId: parameters.userId,
          size: parameters.size,
          price: parameters.price,
          type: OrderType.LIMIT,
          side: OrderSide.SELL,
          status: OrderStatus.NEW,
        },
      },
    );

    return createdOrder as Order;
  }
}
