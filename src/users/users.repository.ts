import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { User } from "./domain/entities/user.entity";
import { QueryTypes } from "sequelize";
import { AssetType } from "src/assets/domain/enums/asset-type.enum";
import { OrderStatus } from "./domain/enums/order-status.enum";
import { OrderSide } from "./domain/enums/order-side.enum";
import { Portfolio } from "./domain/aggregates/portfolio-aggregate";

@Injectable()
export class UsersRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async getUser(id: number): Promise<User> {
    const [result] = await this.sequelize.query<User>(
      `
        SELECT 
            u.id,
            u.email,
            u.accountnumber
        FROM users u
        WHERE u.id = :id
        `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          id,
        },
      },
    );

    return result;
  }

  async getUserPortfolio({ userId }: { userId: number }): Promise<Portfolio> {
    const [portfolio] = await this.sequelize.query<Portfolio>(
      `
        WITH user_orders AS (
            SELECT o.* 
            FROM orders o 
            WHERE 
                o.userid = :userId
                AND o.status = '${OrderStatus.FILLED}'
        ), user_portfolio AS (
            SELECT 
                u.id,
                u.email,
                u.accountnumber,
                i.ticker,
                i.name,
                i.id AS instrumentid,
                COALESCE(SUM(o.size) FILTER (WHERE side IN ('${OrderSide.CASH_IN}', '${OrderSide.BUY}')), 0) -
                COALESCE(SUM(o.size) FILTER (WHERE side IN ('${OrderSide.CASH_OUT}', '${OrderSide.SELL}')), 0) AS quantity
            FROM users u
            LEFT JOIN user_orders o ON o.userid = u.id
            LEFT JOIN instruments i ON o.instrumentid = i.id
            WHERE 
                u.id = :userId
                AND i.type = 'ACCIONES'
            GROUP BY 1,2,3,4,5,6
        ), user_balance AS (
            SELECT 
                COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('${OrderSide.CASH_IN}', '${OrderSide.SELL}')), 0) -
                COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('${OrderSide.CASH_OUT}', '${OrderSide.BUY}')), 0) AS balance
            FROM user_orders o
        )
        SELECT 
            up.id,
            up.email,
            up.accountnumber AS "accountNumber",
            balance,
            COALESCE(JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'ticker', up.ticker,
                    'name', up.name,
                    'quantity', up.quantity,
                    'value', up.quantity * latest_marketdata.close
                ) 
            ) FILTER (WHERE up.instrumentid IS NOT NULL), '[]'::jsonb) AS assets
        FROM user_portfolio up
        LEFT JOIN LATERAL (
            SELECT
                close,
                previousclose
            FROM marketdata m
            WHERE m.instrumentid = up.instrumentid
            ORDER BY date DESC 
            LIMIT 1
        ) AS latest_marketdata ON TRUE
        CROSS JOIN user_balance
        GROUP BY 1, 2, 3, 4;
            `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          userId,
        },
      },
    );

    return portfolio;
  }

  async createOrder(body: any): Promise<any> {
    const order = await this.sequelize.query(
      `
            INSERT INTO orders (userid, instrumentid, size, price, type, side, status)
            VALUES (:userId, :instrumentId, :size, :price, :type, :side, :status)
            RETURNING *;
        `,
      {
        type: QueryTypes.INSERT,
        replacements: {
          userId: body.userId,
          instrumentId: body.instrumentId,
          size: body.size,
          price: body.price,
          type: body.type,
          side: body.side,
          status: body.status,
        },
      },
    );

    return order;
  }
}
