import { InstrumentType } from "../enums/instrument-type.enum";

export class Instrument {
  id: number;
  ticker: string;
  name: string;
  type: InstrumentType;
  dailyYield: string;
}
