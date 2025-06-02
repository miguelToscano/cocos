import { Global, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: "postgres",
        host: configService.get("DATABASE_HOST"),
        port: parseInt(configService.get("DATABASE_PORT")!!),
        username: configService.get("DATABASE_USERNAME"),
        password: configService.get("DATABASE_PASSWORD",),
        database: configService.get("DATABASE_NAME"),
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000,
        },
        logging: false,
      }),
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
