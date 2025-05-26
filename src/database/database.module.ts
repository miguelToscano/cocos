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

      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
      logging: false,
    }),
  ],
  providers: [DatabaseService],
  exports: [SequelizeModule, DatabaseService],
})
export class DatabaseModule {}
