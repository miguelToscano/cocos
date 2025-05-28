import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrdersRepository } from "./orders.repository";
import { Order } from "./domain/entities/order.entity";
import { InstrumentsRepository } from "../instruments/instruments.repository";
import { OrderSide } from "./domain/enums/order-side.enum";
import { OrderType } from "./domain/enums/order-type.enum";
import { PickType } from "@nestjs/mapped-types";
import { PortfoliosRepository } from "../portfolios/portfolios.repository";
import { InstrumentType } from "../instruments/domain/enums/instrument-type.enum";
import { InstrumentWithPrice } from "../instruments/domain/aggregates/instrument-price";
import { OrderStatus } from "./domain/enums/order-status.enum";

type CreateCashInOrderParameters = Pick<Order, "size" | "userId"> & {
  instrument: InstrumentWithPrice;
};

type CreateCashOutOrderParameters = Pick<Order, "size" | "userId"> & {
  instrument: InstrumentWithPrice;
};

type CreateBuyOrderParameters = Pick<Order, "userId" | "type"> &
  Partial<Pick<Order, "size" | "price">> & {
    totalInvestment?: number;
    instrument: InstrumentWithPrice;
  };

type CreateOrderParameters = Pick<Order, "userId" | "type"> &
  Partial<Pick<Order, "size" | "price">> & {
    totalInvestment?: number;
    instrument: InstrumentWithPrice;
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

const size =
      !parameters.size && parameters.totalInvestment
        ? this.getSizeFromTotalInvestment(
            parameters.totalInvestment,
            instrument,
          )
        : parameters.size!!;

    switch (parameters.side) {
      case OrderSide.CASH_IN:
        return this.createCashInOrder({
          userId: parameters.userId,
          size: parameters.size,
          instrument,
          totalInvestment: parameters.totalInvestment,
          type: parameters.type,
        });
      case OrderSide.CASH_OUT:
        return this.createCashOutOrder({
          userId: parameters.userId,
          size: parameters.size,
          instrument,
          totalInvestment: parameters.totalInvestment,
          type: parameters.type
        });
      case OrderSide.BUY:
        return this.createBuyOrder({
          userId: parameters.userId,
          size: parameters.size,
          type: parameters.type,
          totalInvestment: parameters.totalInvestment,
          instrument,
          price: parameters.price,
        });
      case OrderSide.SELL:
        return this.createSellOrder({
          userId: parameters.userId,
          size: parameters.size,
          type: parameters.type,
          totalInvestment: parameters.totalInvestment,
          price: parameters.price,
          instrument,
        });
      default:
    }
  }

  private getSizeFromTotalInvestment(
    totalInvestment: number,
    instrument: InstrumentWithPrice,
  ) {
    if (instrument.type === InstrumentType.MONEDA)
      return totalInvestment / instrument.close;
    if (instrument.type === InstrumentType.ACCIONES)
      return Math.floor(totalInvestment / instrument.close);
    return 1;
  }

  private async createCashInOrder(parameters: CreateOrderParameters) {
    if (parameters.instrument.type !== InstrumentType.MONEDA) {
      throw new BadRequestException(
        `Instrument with id: ${parameters.instrument.id} is not a currency`,
      );
    }

    const size =
      !parameters.size && parameters.totalInvestment
        ? this.getSizeFromTotalInvestment(
            parameters.totalInvestment,
            parameters.instrument,
          )
        : parameters.size!!;

    const createdOrder = await this.ordersRepository.createOrder({
      instrumentId: parameters.instrument.id,
      userId: parameters.userId,
      size,
      price: parameters.instrument.close,
      type: OrderType.MARKET,
      side: OrderSide.CASH_IN,
      status: OrderStatus.FILLED,
    });

    return createdOrder;
  }

  private async createCashOutOrder(parameters: CreateOrderParameters) {
    if (parameters.instrument.type !== InstrumentType.MONEDA) {
      throw new BadRequestException(
        `Instrument with id: ${parameters.instrument.id} is not a currency`,
      );
    }

    const userBalance = await this.portfoliosRepository.getUserBalance(
      parameters.userId,
    );

    const size =
      !parameters.size && parameters.totalInvestment
        ? this.getSizeFromTotalInvestment(
            parameters.totalInvestment,
            parameters.instrument,
          )
        : parameters.size!!;

    const createdOrder = await this.ordersRepository.createOrder({
      instrumentId: parameters.instrument.id,
      userId: parameters.userId,
      size: parameters.size!!,
      price: parameters.instrument.close,
      type: OrderType.MARKET,
      side: OrderSide.CASH_OUT,
      status:
        userBalance.value < size * parameters.instrument.close
          ? OrderStatus.REJECTED
          : OrderStatus.FILLED,
    });

    return createdOrder;
  }

  private async createBuyOrder(parameters: CreateOrderParameters) {
    if (parameters.instrument.type !== InstrumentType.ACCIONES) {
      throw new BadRequestException(
        `Instrument with id: ${parameters.instrument.id} is not a stock`,
      );
    }
    
    const userBalance = await this.portfoliosRepository.getUserBalance(
      parameters.userId,
    );

    // 1 - User creates a MARKET order type providing the quantity (size) of shares he wants to buy
    // 2 - User creates a MARKET order type providing how much money (totalInvestment) he wants to spend
    if (parameters.type === OrderType.MARKET) {
      const size =
        !parameters.size && parameters.totalInvestment
          ? this.getSizeFromTotalInvestment(
              parameters.totalInvestment,
              parameters.instrument,
            )
          : parameters.size!!;

      const createdOrder = await this.ordersRepository.createOrder({
        instrumentId: parameters.instrument.id,
        userId: parameters.userId,
        size: size,
        price: parameters.instrument.close,
        type: OrderType.MARKET,
        side: OrderSide.BUY,
        status:
          userBalance.value < size * parameters.instrument.close
            ? OrderStatus.REJECTED
            : OrderStatus.FILLED,
      });

      return createdOrder;
    }

    // 3 - User creates a LIMIT order type providing the quantity (size) and price (price) he wants the order to be executed at
    // 4 - User creates a LIMIT order type providing the totalInvestment (totalInvestment) and price (price) he wants the order to be executed at
    if (parameters.type === OrderType.LIMIT) {
      parameters.instrument.close = parameters.price!!;

      const size =
        !parameters.size && parameters.totalInvestment
          ? this.getSizeFromTotalInvestment(
              parameters.totalInvestment,
              parameters.instrument,
            )
          : parameters.size!!;

      const createdOrder = await this.ordersRepository.createOrder({
        instrumentId: parameters.instrument.id,
        userId: parameters.userId,
        size: size,
        price: parameters.price!!,
        type: OrderType.LIMIT,
        side: OrderSide.BUY,
        status:
          userBalance.value < size * parameters.price!!
            ? OrderStatus.REJECTED
            : OrderStatus.NEW,
      });

      return createdOrder;
    }
  }

  private async createSellOrder(parameters: CreateOrderParameters) {
    if (parameters.instrument.type !== InstrumentType.ACCIONES) {
      throw new BadRequestException(
        `Instrument with id: ${parameters.instrument.id} is not a stock`,
      );
    }

    const userPortfolio = await this.portfoliosRepository.getUserPortfolio(
      parameters.userId,
      parameters.instrument.id,
    );

    if (userPortfolio.assets[0]?.id !== parameters.instrument.id) {
      throw new NotFoundException(
        `Instrument with id: ${parameters.instrument.id} not found in user portfolio`,
      );
    }

    // 1 - User creates a MARKET order type providing the quantity (size) of shares he wants to buy
    // 2 - User creates a MARKET order type providing how much money (totalInvestment) he wants to spend
    if (parameters.type === OrderType.MARKET) {
      const size =
        !parameters.size && parameters.totalInvestment
          ? this.getSizeFromTotalInvestment(
              parameters.totalInvestment,
              parameters.instrument,
            )
          : parameters.size!!;

      const createdOrder = await this.ordersRepository.createOrder({
        instrumentId: parameters.instrument.id,
        userId: parameters.userId,
        size: size,
        price: parameters.instrument.close,
        type: OrderType.MARKET,
        side: OrderSide.SELL,
        status:
          userPortfolio.assets[0].quantity < size
            ? OrderStatus.REJECTED
            : OrderStatus.FILLED,
      });

      return createdOrder;
    }

    // 3 - User creates a LIMIT order type providing the quantity (size) and price (price) he wants the order to be executed at
    // 4 - User creates a LIMIT order type providing the totalInvestment (totalInvestment) and price (price) he wants the order to be executed at
    if (parameters.type === OrderType.LIMIT) {
      parameters.instrument.close = parameters.price!!;

      const size =
        !parameters.size && parameters.totalInvestment
          ? this.getSizeFromTotalInvestment(
              parameters.totalInvestment,
              parameters.instrument,
            )
          : parameters.size!!;

      const createdOrder = await this.ordersRepository.createOrder({
        instrumentId: parameters.instrument.id,
        userId: parameters.userId,
        size: size,
        price: parameters.price!!,
        type: OrderType.LIMIT,
        side: OrderSide.SELL,
        status:
          userPortfolio.assets[0].quantity < size
            ? OrderStatus.REJECTED
            : OrderStatus.NEW,
      });

      return createdOrder;
    }
  }
}
