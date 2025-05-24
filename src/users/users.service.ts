import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { Portfolio } from "./domain/aggregates/portfolio-aggregate";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUserPortFolio(userId: number): Promise<Portfolio> {
    const user = await this.usersRepository.getUser(userId);

    if (!user) {
      throw new NotFoundException(`User with id: ${userId} not found`);
    }
    
    const portfolio = await this.usersRepository.getUserPortfolio(userId);

    console.log(portfolio);

    return portfolio;
  }

  async createOrder(): Promise<any> {
    throw new Error("Not implemented");
  }
}
