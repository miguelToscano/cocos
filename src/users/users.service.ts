import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { User } from "./domain/entities/user.entity";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUserPortFolio(userId: number): Promise<any> {
    const portfolio = await this.usersRepository.getUserPortfolio({ userId });
    return portfolio;
  }

  async getUser(id: number): Promise<User> {
    const user = await this.usersRepository.getUser(id);
    return user;
  }

  async createOrder(): Promise<any> {
    throw new Error("Not implemented");
  }
}
