import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { QueryTypes } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { InstrumentType } from "../instruments/domain/enums/instrument-type.enum";
import { OrderSide } from "../orders/domain/enums/order-side.enum";
import { OrderStatus } from "../orders/domain/enums/order-status.enum";
import { Balance, Portfolio } from "./domain/aggregates/portfolio.aggregate";

@Injectable()
export class PortfoliosRepository {
  constructor(private readonly database: Sequelize) {}

  /**
   * Retrieves the portfolio information for a specific user, optionally filtered by instrument.
   *
   * This method queries the database to obtain the user's current balance and a list of assets,
   * including details such as ticker, name, quantity, current value, and daily yield for each asset.
   * The balance is calculated based on the user's filled orders, and asset information is aggregated
   * from the user's holdings in "ACCIONES" type instruments.
   *
   * @param userId - The unique identifier of the user whose portfolio is being retrieved.
   * @param instrumentId - (Optional) The unique identifier of a specific instrument to filter the assets.
   * @returns A promise that resolves to a `Portfolio` object containing the user's balance and assets.
   * @throws {InternalServerErrorException} if a database or query error occurs.
   */
  async getUserPortfolio(userId: number, instrumentId?: number) {
    try {
      const userPortfolio = await this.database.query<Portfolio>(
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
                  ${instrumentId ? `AND i.id = :instrumentId` : ``}
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
                          'id', a.id,
                          'ticker', a.ticker,
                          'name', a.name,
                          'quantity', a.quantity,
                          'currentValue', a.quantity * a.close,
                          'dailyYield', CASE WHEN a.quantity != 0 AND a.previous_close != 0 THEN (100 - (a.quantity * a.close) * 100 / (a.quantity * a.previous_close))::NUMERIC(10, 2))::TEXT || '%' ELSE '0%' END   
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
            instrumentId,
          },
        },
      );

      return {
        ...userPortfolio,
        balance: {
          value: parseFloat(String(userPortfolio?.balance.value ?? 0)),
          currency: userPortfolio?.balance.currency ?? "ARS",
        },
        assets:
          userPortfolio?.assets.map((asset) => ({
            ...asset,
            currentValue: parseFloat(String(asset.currentValue ?? 0)),
          })) || [],
      } as Portfolio;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Retrieves the balance for a specific user by calculating the net value of their orders.
   *
   * The balance is computed as the sum of all 'CASH_IN' and 'SELL' order values minus
   * the sum of all 'CASH_OUT' and 'BUY' order values, filtered by orders with status 'FILLED'.
   * The result is returned as a `Balance` object with the value in ARS currency.
   *
   * @param userId - The unique identifier of the user whose balance is to be retrieved.
   * @returns A promise that resolves to a `Balance` object containing the user's balance and currency.
   * @throws {InternalServerErrorException} If an error occurs during the database query.
   */
  async getUserBalance(userId: number) {
    try {
      const userBalance = await this.database.query<Balance>(
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

      return {
        ...userBalance,
        value: parseFloat(String(userBalance?.value ?? 0)),
      } as Balance;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
