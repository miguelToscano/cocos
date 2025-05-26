import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrdersRepository } from "./orders.repository";
import { Order } from "./domain/entities/order.entity";
import { InstrumentsRepository } from "src/instruments/instruments.repository";
import { OrderSide } from "./domain/enums/order-side.enum";
import { OrderType } from "./domain/enums/order-type.enum";
import { PickType } from "@nestjs/mapped-types";
import { PortfoliosRepository } from "src/portfolios/portfolios.repository";

export class CreateCashInOrderParameters extends PickType(Order, [
  "instrumentId",
  "size",
  "userId",
]) {}

export class CreateCashOutOrderParameters extends PickType(Order, [
  "instrumentId",
  "size",
  "userId",
]) {}

export class CreateBuyOrderParameters {}

export class CreateSellOrderParameters {}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly instrumentsRepository: InstrumentsRepository,
    private readonly portfoliosRepository: PortfoliosRepository,
  ) {}

  async createOrder(parameters: {
    userId: number;
    instrumentId: number;
    price: number;
    side: OrderSide;
    size: number;
    type: OrderType;
  }) {
    const instrument = await this.instrumentsRepository.getInstrument(
      parameters.instrumentId,
    );

    if (!instrument) {
      return new NotFoundException(
        `Instrument with id: ${parameters.instrumentId} not found`,
      );
    }

    switch (parameters.side) {
      case OrderSide.CASH_IN:
        return this.createCashInOrder({
          userId: parameters.userId,
          instrumentId: parameters.instrumentId,
          size: parameters.size,
        });
      case OrderSide.CASH_OUT:
        return this.createCashOutOrder({
          userId: parameters.userId,
          instrumentId: parameters.instrumentId,
          size: parameters.size,
        });
      default:
    }
  }

  private async createCashInOrder(parameters: CreateCashInOrderParameters) {
    const createdOrder = await this.ordersRepository.createCashInOrder({
      instrumentId: parameters.instrumentId,
      userId: parameters.userId,
      size: parameters.size,
    });

    return createdOrder;
  }

  private async createCashOutOrder(parameters: CreateCashOutOrderParameters) {
    const userBalance = await this.portfoliosRepository.getUserBalance(
      parameters.userId,
    );

    if (userBalance.value < parameters.size) {
      throw new BadRequestException(
        `User with id: ${parameters.userId} does not have enough balance to cash out ${parameters.size}. Current balance: ${userBalance.currency} ${userBalance.value}`,
      );
    }

    const createdOrder = await this.ordersRepository.createCashOutOrder({
      instrumentId: parameters.instrumentId,
      userId: parameters.userId,
      size: parameters.size,
    });

    return createdOrder;
  }

  private async createBuyOrder() {}

  private async createSellOrder() {}
}
