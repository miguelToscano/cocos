import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

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
  });


  it("/instruments", async () => {
    const response = await request(app.getHttpServer())
      .get("/instruments")
      .query({ limit: 10, offset: 0 });

    expect(response.status).toBe(200);

    expect(response.body.instruments.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty("count");
    expect(response.body.count).toBeGreaterThan(0);
  });

  it("/portfolios/:userId", async () => {
    const response = await request(app.getHttpServer()).get("/portfolios/1");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("balance");
    expect(response.body).toHaveProperty("assets");
    expect(Array.isArray(response.body.assets)).toBe(true);
  });

  it("[POST /orders] CASH_IN Order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "CASH_IN",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000
    });

    console.log(response.body)
    
    expect(response.status).toBe(400);
  });

  it("[POST /orders] CASH_OUT Order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "CASH_OUT",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000
    });

    expect(response.status).toBe(400);
  });

  it("[POST /orders] BUY MARKET Order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "BUY",
      type: "MARKET",
      size: 10,
      totalInvestment: 1000
    });

    console.log(response.body)
    
    expect(response.status).toBe(400);
  });

  it("[POST /orders] BUY by LIMIT order creation should fail when providing both size and totalInvestment parameters ", async () => {
    const response = await request(app.getHttpServer()).post("/orders").send({
      userId: 1,
      instrumentId: 66,
      side: "BUY",
      type: "LIMIT",
      size: 10,
      totalInvestment: 1000
    });

    console.log(response.body)
    
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
      price: 10
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
      price: 10
    });

    expect(response.status).toBe(400);
  });
});
