import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersRepository } from "./orders.repository";
import { OrdersController } from "./orders.controller";
import { InstrumentsModule } from "src/instruments/instruments.module";
import { PortfoliosModule } from "src/portfolios/portfolios.module";

@Module({
  imports: [InstrumentsModule, PortfoliosModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersRepository],
})
export class OrdersModule {}
