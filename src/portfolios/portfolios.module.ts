import { Module } from "@nestjs/common";
import { PortfoliosService } from "./portfolios.service";
import { PortfoliosController } from "./portfolios.controller";
import { PortfoliosRepository } from "./portfolios.repository";

@Module({
  providers: [PortfoliosService, PortfoliosRepository],
  controllers: [PortfoliosController],
  exports: [PortfoliosRepository],
})
export class PortfoliosModule {}
