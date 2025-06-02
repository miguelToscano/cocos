import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { InstrumentsModule } from "./instruments/instruments.module";
import { DatabaseModule } from "./database/database.module";
import { OrdersModule } from "./orders/orders.module";
import { PortfoliosModule } from "./portfolios/portfolios.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    InstrumentsModule,
    OrdersModule,
    DatabaseModule,
    PortfoliosModule,
  ],
})
export class AppModule {}
