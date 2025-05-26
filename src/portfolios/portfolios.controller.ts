import { Controller, Get, HttpCode, HttpStatus, Param } from "@nestjs/common";
import { PortfoliosService } from "./portfolios.service";
import { GetUserPortfolioRequestDto } from "./dto/get-user-portfolio.dto";

@Controller("portfolios")
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getUserPortfolio(@Param() params: GetUserPortfolioRequestDto) {
    const portfolio = await this.portfoliosService.getUserPortfolio(params.id);
    return portfolio;
  }
}
