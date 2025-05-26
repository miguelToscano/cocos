import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { InstrumentsModule } from "./instruments/instruments.module";
import { DatabaseModule } from "./database/database.module";
import { OrdersModule } from "src/orders/orders.module";
import { PortfoliosModule } from "src/portfolios/portfolios.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InstrumentsModule,
    OrdersModule,
    DatabaseModule,
    PortfoliosModule,
  ],
})
export class AppModule {}
