import { Controller, Get, Query } from "@nestjs/common";
import { InstrumentsService } from "./instruments.service";
import { GetInstrumentsRequestDto } from "./dto/get-assets.dto";

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
}
