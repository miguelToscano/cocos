import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { OrdersRepository } from "./orders.repository";
import { Order } from "./domain/entities/order.entity";
import { InstrumentsRepository } from "../instruments/instruments.repository";
import { OrderSide } from "./domain/enums/order-side.enum";
import { OrderType } from "./domain/enums/order-type.enum";
import { PortfoliosRepository } from "../portfolios/portfolios.repository";
import { InstrumentType } from "../instruments/domain/enums/instrument-type.enum";
import { InstrumentWithPrice } from "../instruments/domain/aggregates/instrument-price";
import { OrderStatus } from "./domain/enums/order-status.enum";

type CreateOrderParameters = Pick<Order, "userId" | "type"> &
  Partial<Pick<Order, "size" | "price">> & {
    totalInvestment?: number;
    instrument: InstrumentWithPrice;
  };

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly instrumentsRepository: InstrumentsRepository,
    private readonly portfoliosRepository: PortfoliosRepository,
  ) {}

  /**
   * Creates a new order based on the provided parameters.
   *
   * This method determines the order type and delegates the creation to the appropriate handler
   * (cash in, cash out, buy, or sell). It first retrieves the instrument with its current price,
   * validates its existence, and calculates the order size if not explicitly provided but a total investment is given.
   *
   * @param parameters - The parameters required to create an order.
   * @param parameters.userId - The ID of the user placing the order.
   * @param parameters.instrumentId - The ID of the instrument to trade.
   * @param parameters.side - The side of the order (e.g., BUY, SELL, CASH_IN, CASH_OUT).
   * @param parameters.type - The type of the order.
   * @param parameters.size - (Optional) The size of the order.
   * @param parameters.price - (Optional) The price for the order.
   * @param parameters.totalInvestment - (Optional) The total investment amount for the order.
   * @returns The result of the order creation or a NotFoundException if the instrument does not exist.
   */
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
          type: parameters.type,
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
        throw new BadRequestException(`Invalid order side: ${parameters.side}`);
    }
  }

  /**
   * Calculates the size (quantity) of an instrument that can be purchased with a given total investment.
   *
   * - For instruments of type `MONEDA`, returns the exact division of the investment by the instrument's closing price.
   * - For instruments of type `ACCIONES`, returns the floored division (whole units only).
   * - For other instrument types, returns 1.
   *
   * @param totalInvestment - The total amount of money to invest.
   * @param instrument - The instrument with its price and type information.
   * @throws {InternalServerErrorException} If the instrument price is 0.
   * @returns The calculated size (quantity) of the instrument to purchase.
   */
  private getSizeFromTotalInvestment(
    totalInvestment: number,
    instrument: InstrumentWithPrice,
  ): number {
    if (instrument.type === InstrumentType.MONEDA)
      return totalInvestment / instrument.close;
    if (instrument.type === InstrumentType.ACCIONES) {
      if (instrument.close === 0) {
        throw new InternalServerErrorException(
          `Instrument with id: ${instrument.id} has a close price of 0`,
        );
      }
      return Math.floor(totalInvestment / instrument.close);
    }
    return 1;
  }

  /**
   * Creates a cash-in order for a given instrument and user.
   *
   * This method validates that the provided instrument is of type `MONEDA` (currency).
   * If the `size` parameter is not provided but `totalInvestment` is, it calculates the order size
   * based on the total investment and instrument details. Otherwise, it uses the provided size.
   * The order is created with type `MARKET`, side `CASH_IN`, and status `FILLED`.
   *
   * @param parameters - The parameters required to create the order, including instrument, user, size, and/or total investment.
   * @throws {BadRequestException} If the instrument is not a currency.
   * @returns A promise that resolves to the created order.
   */
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

  /**
   * Creates a cash-out order for a user based on the provided parameters.
   *
   * This method validates that the instrument is a currency, calculates the order size
   * if not explicitly provided, checks the user's balance, and creates a market order
   * with the appropriate status (FILLED or REJECTED).
   *
   * @param parameters - The parameters required to create the order, including user ID,
   *   instrument details, size, and/or total investment.
   * @returns A promise that resolves to the created order.
   * @throws {BadRequestException} If the instrument is not a currency.
   */
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

  /**
   * Creates a buy order for a given instrument and user, supporting both market and limit order types.
   *
   * - Validates that the instrument is a stock (`InstrumentType.ACCIONES`).
   * - For market orders, calculates the size based on either the provided size or total investment.
   * - For limit orders, uses the specified price and updates the instrument's close price accordingly.
   * - Checks the user's balance to determine if the order should be filled, rejected, or set as new.
   * - Returns the created order object.
   *
   * @param parameters - The parameters required to create the order, including user, instrument, order type, size, price, and total investment.
   * @throws {BadRequestException} If the instrument is not a stock.
   * @returns A promise that resolves to the created order.
   */
  private async createBuyOrder(parameters: CreateOrderParameters) {
    if (parameters.instrument.type !== InstrumentType.ACCIONES) {
      throw new BadRequestException(
        `Instrument with id: ${parameters.instrument.id} is not a stock`,
      );
    }

    const userBalance = await this.portfoliosRepository.getUserBalance(
      parameters.userId,
    );

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

  /**
   * Creates a sell order for a given instrument and user.
   *
   * This method validates that the instrument is a stock, checks if the user owns the instrument,
   * and then creates either a market or limit sell order based on the provided parameters.
   * The order status is determined by whether the user has enough quantity of the asset.
   *
   * @param parameters - The parameters required to create the sell order, including instrument, user, order type, size, and price.
   * @throws {BadRequestException} If the instrument is not a stock.
   * @throws {NotFoundException} If the instrument is not found in the user's portfolio.
   * @returns The created order object.
   */
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

    if (parameters.type === OrderType.LIMIT) {
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
