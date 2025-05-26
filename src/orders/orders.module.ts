import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersRepository } from "./orders.repository";
import { OrdersController } from "./orders.controller";
import { InstrumentsModule } from "../instruments/instruments.module";
import { PortfoliosModule } from "../portfolios/portfolios.module";

@Module({
  imports: [InstrumentsModule, PortfoliosModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersRepository],
})
export class OrdersModule {}
