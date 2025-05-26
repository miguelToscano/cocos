import { Controller, Get, HttpCode, Param } from "@nestjs/common";
import { PortfoliosService } from "./portfolios.service";

@Controller("portfolios")
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get(":id")
  @HttpCode(200)
  async getUserPortfolio(@Param("id") userId: number) {
    const portfolio = await this.portfoliosService.getUserPortfolio(userId);
    return portfolio;
  }
}
