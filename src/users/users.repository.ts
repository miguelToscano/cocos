import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { User } from "./entities/user.entity";
import { QueryTypes } from "sequelize";

@Injectable()
export class UsersRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async getUser(id: number): Promise<User> {
    const [user] = await this.sequelize.query(
      `
        SELECT
            id,
            email,
            NULL as "publicId"
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

    return user as unknown as User;
  }

  async getUserPortfolio({ userId }: { userId: number }): Promise<any> {
    const [portfolio] = await this.sequelize.query(
      `
        SELECT 
            u.id,
            COALESCE(
                SUM(o.size * o.price) FILTER (WHERE i."type" = 'MONEDA' AND o.status = 'FILLED' AND o.side = 'CASH_IN') -
                SUM(o.size * o.price) FILTER (WHERE i."type" = 'MONEDA' AND o.status = 'FILLED' AND o.side = 'CASH_OUT'),
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
