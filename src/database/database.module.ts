import { Global, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DatabaseService } from "./database.service";

@Global()
@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "postgres",
      database: "cocos",
      autoLoadModels: false,
      synchronize: false,

      // ✅ Connection pool settings
      pool: {
        max: 10, // Max number of connections in pool
        min: 2, // Minimum number of connections
        acquire: 30000, // Max time (ms) to try getting a connection before throwing
        idle: 10000, // Max time (ms) a connection can be idle before being released
      },
      logging: false, // Optional: disable logging
    }),
  ],
  providers: [DatabaseService],
  exports: [SequelizeModule, DatabaseService],
})
export class DatabaseModule {}
