import { Injectable } from "@nestjs/common";
import { QueryTypes } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { InstrumentType } from "src/instruments/domain/enums/instrument-type.enum";
import { OrderSide } from "src/orders/domain/enums/order-side.enum";
import { OrderStatus } from "src/orders/domain/enums/order-status.enum";

@Injectable()
export class PortfoliosRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async getUserPortfolio(userId: number) {
    const userPortfolio = await this.sequelize.query<any>(
      `
            WITH assets AS (
              SELECT
                  o.user_id,
                  i.id,
                  i.ticker,
                  i.name,
                  marketdata.close,
                  marketdata.previous_close,
                  COALESCE(SUM(o.size) FILTER (WHERE o.side = '${OrderSide.BUY}'), 0) - COALESCE(SUM(o.size) FILTER (WHERE o.side = '${OrderSide.SELL}'), 0) AS quantity
              FROM orders o
              INNER JOIN instruments i ON o.instrument_id = i.id
              LEFT JOIN LATERAL (
                  SELECT
                      close,
                      previous_close
                  FROM marketdata 
                  WHERE marketdata.instrument_id = i.id
                  ORDER BY date DESC
                  LIMIT 1
              ) AS marketdata ON TRUE
              WHERE 
                  o.user_id = :userId
                  AND o.status = '${OrderStatus.FILLED}'
                  AND i.type = '${InstrumentType.ACCIONES}'
              GROUP BY o.user_id, i.id, i.ticker, i.name, marketdata.close, marketdata.previous_close
          )
          SELECT
              user_balance.balance,
              user_assets.assets
          FROM users u
          LEFT JOIN LATERAL (
              SELECT JSONB_BUILD_OBJECT(
                'value', (COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('${OrderSide.CASH_IN}', '${OrderSide.SELL}')), 0) -
                  COALESCE(SUM(o.price * o.size) FILTER (WHERE side IN ('${OrderSide.CASH_OUT}', '${OrderSide.BUY}')), 0))::NUMERIC(10, 2),
                'currency', 'ARS'
              ) AS balance
              FROM orders o
              INNER JOIN instruments i ON i.id = o.instrument_id
              WHERE 
                  o.user_id = u.id
                  AND o.status = '${OrderStatus.FILLED}'
          ) AS user_balance ON TRUE
          LEFT JOIN LATERAL (
              SELECT
                  COALESCE(JSONB_AGG(
                      JSONB_BUILD_OBJECT(
                          'instrumentId', a.id,
                          'ticker', a.ticker,
                          'name', a.name,
                          'quantity', a.quantity,
                          'currentValue', a.quantity * a.close,
                          'dailyYield', (((a.quantity * a.close) * 100 / (a.quantity * a.previous_close))::NUMERIC(10, 2) - 100)::TEXT || '%'
                      ) 
                  ORDER BY a.quantity DESC), '[]'::jsonb) AS assets
              FROM assets a
              WHERE a.user_id = u.id
          ) AS user_assets ON TRUE
          WHERE u.id = :userId
          `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          userId,
        },
      },
    );

    return userPortfolio;
  }

  async getUserBalance(userId: number) {
    try {
    const userBalance = await this.sequelize.query<any>(
      `
        SELECT 
            COALESCE(SUM(o.price * o.size) FILTER (WHERE o.side IN ('${OrderSide.CASH_IN}', '${OrderSide.SELL}')), 0) -
            COALESCE(SUM(o.price * o.size) FILTER (WHERE o.side IN ('${OrderSide.CASH_OUT}', '${OrderSide.BUY}')), 0)::NUMERIC(10, 2) AS value,
            'ARS' AS currency
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        LEFT JOIN instruments i ON i.id = o.instrument_id
        WHERE 
            u.id = :userId
            AND o.user_id = :userId
            AND o.status = '${OrderStatus.FILLED}';
        `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
        userId,
        },
      },
    );

      return userBalance;
    } catch (error) {
      throw error;
    }
  }
}
