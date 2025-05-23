import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class UsersRepository {
    constructor(private readonly sequelize: Sequelize) {}

    async getUserPortfolio({userId}: {userId: number}): Promise<any> {
        const [portfolio] = await this.sequelize.query(`
            
            `, {
                replacements: {
                    userId
                }
            })

        return portfolio;
    }
}
