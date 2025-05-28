import { Injectable } from "@nestjs/common";
import { InstrumentsRepository } from "./instruments.repository";
import { Instrument } from "./domain/entities/instrument.entity";
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "./domain/constants/pagination.constant";

@Injectable()
export class InstrumentsService {
  constructor(private readonly instrumentsRepository: InstrumentsRepository) {}

  /**
   * Retrieves a list of instruments with optional search, pagination, and count.
   *
   * @param params - The parameters for retrieving instruments.
   * @param params.search - Optional search string to filter instruments.
   * @param params.limit - Optional maximum number of instruments to return. Defaults to a predefined limit if not provided.
   * @param params.offset - Optional number of instruments to skip for pagination. Defaults to a predefined offset if not provided.
   * @returns A promise that resolves to an object containing the array of instruments and the total count.
   * @throws Rethrows any error encountered during the retrieval process.
   */
  async getInstruments({
    search,
    limit,
    offset,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ instruments: Instrument[]; count: number }> {
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
  }
}
