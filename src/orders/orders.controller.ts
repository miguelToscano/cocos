import { Controller, HttpCode, HttpStatus, Post, Body } from "@nestjs/common";
import { CreateOrderRequestDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() body: CreateOrderRequestDto) {
    const result = await this.ordersService.createOrder({
      userId: body.userId,
      instrumentId: body.instrumentId,
      type: body.type,
      price: body.price,
      side: body.side,
      size: body.size,
    });

    return result;
  }
}
