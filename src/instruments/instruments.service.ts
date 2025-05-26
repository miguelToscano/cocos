import { Injectable, NotFoundException } from "@nestjs/common";
import { InstrumentsRepository } from "./instruments.repository";
import { Instrument } from "./domain/entities/instrument.entity";
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "./domain/constants/pagination.constant";

@Injectable()
export class InstrumentsService {
  constructor(private readonly instrumentsRepository: InstrumentsRepository) {}

  async getInstruments({
    search,
    limit,
    offset,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ instruments: Instrument[]; count: number }> {
    try {
      const instruments = search
        ? await this.instrumentsRepository.searchInstruments({
            search,
            limit: limit ?? DEFAULT_LIMIT,
            offset: offset ?? DEFAULT_OFFSET,
          })
        : await this.instrumentsRepository.getInstruments({
            limit: limit ?? DEFAULT_LIMIT,
            offset: offset ?? DEFAULT_OFFSET,
          });

      return instruments as unknown as {
        instruments: Instrument[];
        count: number;
      };
    } catch (error) {
      throw error;
    }
  }
}
