import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { Sequelize } from "sequelize-typescript";
import { Order } from "../src/orders/domain/entities/order.entity";
import { OrderSide } from "../src/orders/domain/enums/order-side.enum";
import { OrderType } from "../src/orders/domain/enums/order-type.enum";
import { OrderStatus } from "../src/orders/domain/enums/order-status.enum";
import { QueryTypes } from "sequelize";

let database: Sequelize;

describe("AppController (e2e)", () => {
  let app: INestApplication;

  async function createOrder(parameters: {
    userId: number;
    instrumentId: number;
    side: OrderSide;
    type: OrderType;
    size?: number;
    totalInvestment?: number;
    price?: number;
    status: OrderStatus;
  }): Promise<Order> {
    const order = await database.query(
      `
      INSERT INTO orders (instrument_id, user_id, size, price, type, side, status)
      VALUES (:instrumentId, :userId, :size, :price, :type, :side, :status)
      RETURNING *
    `,
      {
        type: QueryTypes.SELECT,
        plain: true,
        replacements: {
          instrumentId: parameters.instrumentId,
          userId: parameters.userId,
          size: parameters.size ?? 0,
          price: parameters.price ?? 1,
          type: parameters.type,
          side: parameters.side,
          status: parameters.status,
        },
      },
    );

    return order as Order;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    await app.init();
    database = app.get(Sequelize);
  });

  beforeEach(async () => {
    await database.query("DELETE FROM orders");
  });

  it("[POST /orders] CASH_IN Order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "CASH_IN",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] CASH_IN Order creation should fail when instrument is not a currency", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: "CASH_IN",
      type: "MARKET",
      size: 10,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] CASH_OUT Order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "CASH_OUT",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] CASH_OUT Order creation should fail when instrument is not a currency ", async () => {
    await createOrder({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 10,
      price: 1,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "CASH_OUT",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] BUY MARKET Order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: "BUY",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] BUY MARKET Order creation should fail when instrument is not a stock", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "BUY",
      type: "MARKET",
      size: 10,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] BUY by LIMIT order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "BUY",
      type: "LIMIT",
      size: 10,
      totalInvestment: 1000,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] BUY by LIMIT order creation should fail  when instrument is not a stock", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "BUY",
      type: "LIMIT",
      size: 10,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] SELL by LIMIT order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "SELL",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000,
      price: 10,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] SELL by LIMIT Order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "SELL",
      type: "LIMIT",
      size: 10,
      totalInvestment: 1000,
      price: 10,
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] CASH_IN Order creation should succeed ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(response.status).toBe(201);

    expect(response.body.status).toBe(OrderStatus.FILLED);
    expect(response.body.side).toBe(OrderSide.CASH_IN);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(66);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] CASH_OUT Order creation should fail when user has not cashed in any money yet", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_OUT,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(response.status).toBe(201);

    expect(response.body.status).toBe(OrderStatus.REJECTED);
    expect(response.body.side).toBe(OrderSide.CASH_OUT);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(66);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] CASH_OUT Order creation should succeed when user has sufficient balance", async () => {
    await createOrder({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 10,
      price: 1,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_OUT,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(response.status).toBe(201);

    expect(response.body.status).toBe(OrderStatus.FILLED);
    expect(response.body.side).toBe(OrderSide.CASH_OUT);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(66);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] CASH_OUT Order creation should fail when user runs out of money after multiple cash outs", async () => {
    await createOrder({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 10,
      price: 1,
      status: OrderStatus.FILLED,
    });

    await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_OUT,
      type: OrderType.MARKET,
      size: 10,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: OrderSide.CASH_OUT,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(response.status).toBe(201);

    expect(response.body.status).toBe(OrderStatus.REJECTED);
    expect(response.body.side).toBe(OrderSide.CASH_OUT);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(66);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] BUY MARKET Order creation should succeed when providing size parameter", async () => {
    await createOrder({
      userId: 1,
      instrumentId: 65,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 1000000,
      price: 1,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.FILLED);
    expect(response.body.side).toBe(OrderSide.BUY);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] BUY MARKET Order creation should succeed when providing totalInvestment parameter", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 1000000,
      price: 1,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      totalInvestment: 2590,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.FILLED);
    expect(response.body.side).toBe(OrderSide.BUY);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] BUY LIMIT Order creation should succeed when providing size parameter", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 65,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 1000000,
      price: 1,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      size: 10,
      price: 260,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.NEW);
    expect(response.body.side).toBe(OrderSide.BUY);
    expect(response.body.type).toBe(OrderType.LIMIT);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.price).toBe(260);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] BUY LIMIT Order creation should succeed when providing totalInvestment parameter", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 65,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      size: 1000000,
      price: 1,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      totalInvestment: 2600,
      price: 260,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.NEW);
    expect(response.body.side).toBe(OrderSide.BUY);
    expect(response.body.type).toBe(OrderType.LIMIT);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.price).toBe(260);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] SELL MARKET Order creation should succeed when providing size parameter", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
      price: 259,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.FILLED);
    expect(response.body.side).toBe(OrderSide.SELL);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] SELL MARKET Order creation should fail for not having enough instrument size when providing size parameter", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
      price: 259,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      size: 11,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.REJECTED);
    expect(response.body.side).toBe(OrderSide.SELL);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(11);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] SELL MARKET Order creation should succeed when providing totalInvestment parameter", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
      price: 259,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      totalInvestment: 2590,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.FILLED);
    expect(response.body.side).toBe(OrderSide.SELL);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(10);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] SELL MARKET Order creation should fail for not having enough instrument size when providing totalInvestment parameter", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
      price: 259,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      totalInvestment: 3000,
    });

    console.log(response.body);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.REJECTED);
    expect(response.body.side).toBe(OrderSide.SELL);
    expect(response.body.type).toBe(OrderType.MARKET);
    expect(response.body.size).toBe(11);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] SELL LIMIT Order creation should succeed when providing size parameters", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      size: 1000,
      price: 259,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      size: 1000,
      price: 260,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.NEW);
    expect(response.body.side).toBe(OrderSide.SELL);
    expect(response.body.type).toBe(OrderType.LIMIT);
    expect(response.body.size).toBe(1000);
    expect(response.body.price).toBe(260);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] SELL LIMIT Order creation should fail for not having enough instrument size when providing size parameters", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      size: 1000,
      price: 259,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      size: 1001,
      price: 260,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.REJECTED);
    expect(response.body.side).toBe(OrderSide.SELL);
    expect(response.body.type).toBe(OrderType.LIMIT);
    expect(response.body.size).toBe(1001);
    expect(response.body.price).toBe(260);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });

  it("[POST /orders] SELL LIMIT Order creation should succeed when providing totalInvestment parameters", async () => {
    // Instrument with id = 1 has a close of 259
    await createOrder({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      size: 1000,
      price: 259,
      status: OrderStatus.FILLED,
    });

    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 1,
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      totalInvestment: 2600,
      price: 260,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(OrderStatus.NEW);
    expect(response.body.side).toBe(OrderSide.SELL);
    expect(response.body.type).toBe(OrderType.LIMIT);
    expect(response.body.size).toBe(10);
    expect(response.body.price).toBe(260);
    expect(response.body.instrumentId).toBe(1);
    expect(response.body.userId).toBe(1);
  });
});
