import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { User } from "./domain/entities/user.entity";
import { QueryTypes } from "sequelize";
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
            u.accountnumber AS "accountNumber"
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

  async getUserBalance(userId: number): Promise<number> {
    const [result] = await this.sequelize.query<{balance: number}>(
        `SELECT
                (COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('CASH_IN', 'SELL')), 0) -
                COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('CASH_OUT', 'BUY')), 0))::NUMERIC(10, 2) AS balance
            FROM orders o
            INNER JOIN instruments i ON i.id = o.instrumentid
            WHERE 
                o.userid = :userId
                AND o.status = 'FILLED'`,
        {
        type: QueryTypes.SELECT,
        replacements: {
          userId,
        },
      },
    );

    return result.balance ?? 0;
  }

  async getUserPortfolio(userId: number): Promise<Portfolio> {
    const [portfolio] = await this.sequelize.query<Portfolio>(
      `
        WITH assets AS (
            SELECT
                o.userid,
                i.id,
                i.ticker,
                i.name,
                marketdata.close,
                marketdata.previousclose,
                COALESCE(SUM(o.size) FILTER (WHERE o.side = 'BUY'), 0) - COALESCE(SUM(o.size) FILTER (WHERE o.side = 'SELL'), 0) AS quantity
            FROM orders o
            INNER JOIN instruments i ON o.instrumentid = i.id
            LEFT JOIN LATERAL (
                SELECT
                    close,
                    previousclose
                FROM marketdata 
                WHERE marketdata.instrumentid = i.id
                ORDER BY date DESC
                LIMIT 1
            ) AS marketdata ON TRUE
            WHERE 
                o.userid = :userId
                AND o.status = 'FILLED'
                AND i.type = 'ACCIONES'
            GROUP BY o.userid, i.id, i.ticker, i.name, marketdata.close, marketdata.previousclose
        )
        SELECT 
            u.id,
            u.email,
            u.accountnumber AS "accountNumber",
            user_balance.balance,
            user_assets.assets
        FROM users u
        LEFT JOIN LATERAL (
            SELECT
                '$' || (COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('CASH_IN', 'SELL')), 0) -
                COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('CASH_OUT', 'BUY')), 0))::NUMERIC(10, 2)::TEXT AS balance
            FROM orders o
            INNER JOIN instruments i ON i.id = o.instrumentid
            WHERE 
                o.userid = u.id
                AND o.status = 'FILLED'
        ) AS user_balance ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                COALESCE(JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'ticker', a.ticker,
                        'name', a.name,
                        'quantity', a.quantity,
                        'currentValue', a.quantity * a.close,
                        'dailyYield', (((a.quantity * a.close) * 100 / (a.quantity * a.previousclose))::NUMERIC(10, 2) - 100)::TEXT || '%'
                    ) 
                ORDER BY a.quantity DESC), '[]'::jsonb) AS assets
            FROM assets a
            WHERE a.userid = u.id
        ) AS user_assets ON TRUE
        WHERE u.id = :userId
            `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          userId,
        },
      },
    );

    console.log(portfolio);

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
