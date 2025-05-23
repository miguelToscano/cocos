import { Module } from "@nestjs/common";
import { HealthModule } from "../health/health.module";
import { UsersModule } from "../users/users.module";
import { ConfigModule } from "@nestjs/config";
import { AssetsModule } from "../assets/assets.module";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AssetsModule,
    DatabaseModule,
  ],
})
export class AppModule {}
