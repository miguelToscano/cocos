import { Body, Controller, Post, Param, Get } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { GetUserPortfolioRequestDto } from "./dto/get-user-portfolio.dto";

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
  ): Promise<number> {
    const result = await this.usersService.getUserPortFolio(params.id);
    console.log(result);
    return 1;
  }
}
