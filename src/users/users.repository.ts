import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { User } from "./domain/entities/user.entity";
import { QueryTypes } from "sequelize";
import { AssetType } from "src/assets/domain/enums/asset-type.enum";
import { OrderStatus } from "./domain/enums/order-status-enum";
import { OrderSide } from "./domain/enums/order-side-enum";

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


  async getUserPortfolio({ userId }: { userId: number }): Promise<any> {
    const [portfolio] = await this.sequelize.query(
      `
        SELECT 
            u.id,
            COALESCE(
                SUM(o.size * o.price) FILTER (WHERE i."type" = '${AssetType.MONEDA}' AND o.status = '${OrderStatus.FILLED}' AND o.side = '${OrderSide.CASH_IN}') -
                SUM(o.size * o.price) FILTER (WHERE i."type" = '${AssetType.MONEDA}' AND o.status = 'FILLED' AND o.side = 'CASH_OUT'),
            0) AS moneda
        FROM users u 
        LEFT JOIN orders o ON o.userid = u.id
        LEFT JOIN instruments i ON i.id = o.instrumentid 
        WHERE u.id = :userId
        GROUP BY u.id;   
            `,
      {
        replacements: {
          userId,
        },
      },
    );

    return portfolio;
  }
}
