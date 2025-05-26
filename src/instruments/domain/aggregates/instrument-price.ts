import { Instrument } from "../entities/instrument.entity";

export type InstrumentWithPrice = Instrument & {
  close: number;
  previousClose: number;
};
