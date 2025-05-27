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
  constructor(private readonly sequelize: Sequelize) {}

  async createOrder(parameter: CreateOrderParameters): Promise<Order> {
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

    return createdOrder as Order;
  }
}
