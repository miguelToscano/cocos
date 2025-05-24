import { Body, Controller, Post, Param, Get } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import {
  GetUserPortfolioRequestDto,
  GetUserPortfolioResponseDto,
} from "./dto/get-user-portfolio.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  async createOrder(@Body() body: CreateOrderDto): Promise<any> {
    const order = await this.usersService.createOrder();
    return order;
  }

  @Get(":id/portfolio")
  async getUserPortfolio(
    @Param() params: GetUserPortfolioRequestDto,
  ): Promise<GetUserPortfolioResponseDto> {
    const result = await this.usersService.getUserPortFolio(params.id);
    return result as GetUserPortfolioResponseDto;
  }
}
