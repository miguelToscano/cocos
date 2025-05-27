import { Instrument } from "src/instruments/domain/entities/instrument.entity";

export interface Balance {
  value: number;
  currency: string;
}

export interface Portfolio {
  balance: Balance;
  assets: PortfolioAsset[];
}

export interface PortfolioAsset extends Instrument {
  quantity: number;
  dailyYield: string;
  currentValue: number;
}
