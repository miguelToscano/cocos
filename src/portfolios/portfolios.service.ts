import { Injectable } from "@nestjs/common";
import { PortfoliosRepository } from "./portfolios.repository";

@Injectable()
export class PortfoliosService {
  constructor(private readonly portfoliosRepository: PortfoliosRepository) {}

  async getUserPortfolio(userId: number) {
    const portfolio = await this.portfoliosRepository.getUserPortfolio(userId);
    return portfolio;
  }
}
