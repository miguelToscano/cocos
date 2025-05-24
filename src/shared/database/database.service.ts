import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly sequelize: Sequelize) {}

  async onModuleInit() {
    await this.ping();
  }

  async ping(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      this.logger.log("Database connection has been established successfully.");
    } catch (error) {
      this.logger.error("Unable to connect to the database:", error);
      throw error;
    }
  }
}
