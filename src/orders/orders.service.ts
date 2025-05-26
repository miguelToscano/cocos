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
import { Instrument } from "src/instruments/domain/entities/instrument.entity";
import { InstrumentType } from "src/instruments/domain/enums/instrument-type.enum";
import { InstrumentWithPrice } from "src/instruments/domain/aggregates/instrument-price";
import { OrderStatus } from "./domain/enums/order-status.enum";

type CreateCashInOrderParameters = Pick<
  Order,
  "instrumentId" | "size" | "userId"
>;

type CreateCashOutOrderParameters = Pick<
  Order,
  "instrumentId" | "size" | "userId"
>;

// type CreateBuyOrderParameters = Pick<Order, 'instrumentId' | 'userId'> & {
//     amount: FixedAmount | TotalInvestmentAmount;
//     type: CreateBuyLimitOrderParameters | CreateBuyMarketOrderParameters;
// }

// type CreateBuyMarketOrderParameters = {
//     type: OrderType.MARKET;
//     amount: FixedAmount | TotalInvestmentAmount;
// }

// type CreateBuyLimitOrderParameters = {
//     type: OrderType.LIMIT;
//     amount: FixedAmount | TotalInvestmentAmount;
//     price: number;
// }

// type FixedAmount = {
//     type: 'FIXED'
//     size: number;
// }

// type TotalInvestmentAmount = {
//     type: 'TOTAL_INVESTMENT';
//     total: number;
// }

type CreateBuyOrderParameters = Pick<
  Order,
  "instrumentId" | "userId" | "type"
> & {
  price?: number;
  size?: number;
  totalInvestment?: number;
  instrumentClose: number;
};

class CreateSellOrderParameters {}

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
    side: OrderSide;
    type: OrderType;
    size?: number;
    price?: number;
    totalInvestment?: number;
  }) {
    const instrument = await this.instrumentsRepository.getInstrumentWithPrice(
      parameters.instrumentId,
    );

    if (!instrument) {
      return new NotFoundException(
        `Instrument with id: ${parameters.instrumentId} not found`,
      );
    }

    const sizeFromTotalInvestment =
      !parameters.size && parameters.totalInvestment
        ? this.getSizeFromTotalInvestment(
            parameters.totalInvestment,
            instrument,
          )
        : null;

    if (!parameters.size && !sizeFromTotalInvestment) {
      throw new BadRequestException(`Size or totalInvestment must be provided`);
    }

    switch (parameters.side) {
      case OrderSide.CASH_IN:
        return this.createCashInOrder({
          userId: parameters.userId,
          instrumentId: parameters.instrumentId,
          size: (parameters.size ?? sizeFromTotalInvestment)!!,
        });
      case OrderSide.CASH_OUT:
        return this.createCashOutOrder({
          userId: parameters.userId,
          instrumentId: parameters.instrumentId,
          size: (parameters.size ?? sizeFromTotalInvestment)!!,
        });
      case OrderSide.BUY:
        return this.createBuyOrder({
          userId: parameters.userId,
          instrumentId: parameters.instrumentId,
          size: parameters.size,
          instrumentClose: instrument.close,
          type: parameters.type,
          totalInvestment: parameters.totalInvestment,
        });
      case OrderSide.SELL:
        return this.createSellOrder();
      default:
    }
  }

  private getSizeFromTotalInvestment(
    totalInvestment: number,
    instrument: InstrumentWithPrice,
  ): number {
    if (instrument.type === InstrumentType.MONEDA)
      return totalInvestment / instrument.close;
    if (instrument.type === InstrumentType.ACCIONES)
      return Math.floor(totalInvestment / instrument.close);
    throw new Error();
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

    const createdOrder = await this.ordersRepository.createCashOutOrder({
      instrumentId: parameters.instrumentId,
      userId: parameters.userId,
      size: parameters.size,
      status:
        userBalance.value < parameters.size
          ? OrderStatus.REJECTED
          : OrderStatus.FILLED,
    });

    return createdOrder;
  }

  private async createBuyOrder(parameters: CreateBuyOrderParameters) {
    const userBalance = await this.portfoliosRepository.getUserBalance(
      parameters.userId,
    );
  }

  private async createBuyLimitOrder() {}

  private async createSellOrder() {}
}
