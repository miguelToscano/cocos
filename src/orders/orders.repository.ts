import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { Order } from "./domain/entities/order.entity";
import { QueryTypes } from "sequelize";

export type CreateOrderParameters = Pick<
  Order,
  "instrumentId" | "size" | "userId" | "status" | "price" | "side" | "type"
>;

@Injectable()
export class OrdersRepository {
  constructor(private readonly database: Sequelize) {}

  async createOrder(parameter: CreateOrderParameters): Promise<Order> {
    const createdOrder = await this.database.query<Order>(
      `
        INSERT INTO orders (instrument_id, user_id, size, price, type, side, status)
        VALUES (:instrumentId, :userId, :size, :price, :type, :side, :status)
        RETURNING id, instrument_id AS "instrumentId", user_id AS "userId", size, price, type, side, status
      `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          instrumentId: parameter.instrumentId,
          userId: parameter.userId,
          size: parameter.size,
          price: parameter.price,
          type: parameter.type,
          side: parameter.side,
          status: parameter.status,
        },
      },
    );

    return {
      ...createdOrder,
      size: parseFloat(String(createdOrder?.size ?? 0)),
      price: parseFloat(String(createdOrder?.price ?? 0)),
    } as Order;
  }
}
