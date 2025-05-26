import { Controller, Get, Param, Query } from "@nestjs/common";
import { InstrumentsService } from "./instruments.service";
import {
  GetInstrumentsRequestDto,
  GetInstrumentsResponseDto,
} from "./dto/get-assets.dto";
import {
  GetInstrumentRequestDto,
  GetInstrumentResponseDto,
} from "./dto/get-asset.dto";

@Controller("instruments")
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get()
  async getInstruments(@Query() query: GetInstrumentsRequestDto) {
    const instruments = await this.instrumentsService.getInstruments({
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    });

    return instruments;
  }

  @Get("/:id")
  async getInstrument(
    @Param() params: GetInstrumentRequestDto,
  ): Promise<GetInstrumentResponseDto> {
    const asset = await this.instrumentsService.getInstrument(params.id);

    return {
      asset,
    };
  }
}
