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

  /**
   * Retrieves a list of assets with optional search, pagination, and count.
   *
   * @param params - The parameters for retrieving assets.
   * @param params.search - Optional search string to filter assets.
   * @param params.limit - Optional maximum number of assets to return. Defaults to `DEFAULT_LIMIT`.
   * @param params.offset - Optional number of assets to skip for pagination. Defaults to `DEFAULT_OFFSET`.
   * @returns A promise that resolves to an object containing the array of assets and the total count.
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

  /**
   * Retrieves an asset by its unique identifier.
   *
   * @param id - The unique identifier of the asset to retrieve.
   * @returns A promise that resolves to the requested {@link Instrument}.
   * @throws NotFoundException If no asset with the specified id is found.
   */
  async getInstrument(id: number): Promise<Instrument> {
    try {
      const instrument = await this.instrumentsRepository.getInstrument(id);

      if (!instrument) {
        throw new NotFoundException(`Instrument with id: ${id} not found`);
      }

      return instrument;
    } catch (error) {
      throw error;
    }
  }
}
