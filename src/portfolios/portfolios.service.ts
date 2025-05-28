import { Injectable } from "@nestjs/common";
import { PortfoliosRepository } from "./portfolios.repository";

@Injectable()
export class PortfoliosService {
  constructor(private readonly portfoliosRepository: PortfoliosRepository) {}

  /**
   * Retrieves the portfolio associated with a specific user.
   *
   * @param userId - The unique identifier of the user whose portfolio is to be fetched.
   * @returns A promise that resolves to the user's portfolio.
   */
  async getUserPortfolio(userId: number) {
    const portfolio = await this.portfoliosRepository.getUserPortfolio(userId);
    return portfolio;
  }
}
