import { Module } from "@nestjs/common";
import { InstrumentsService } from "./instruments.service";
import { InstrumentsController } from "./instruments.controller";
import { InstrumentsRepository } from "./instruments.repository";

@Module({
  controllers: [InstrumentsController],
  providers: [InstrumentsService, InstrumentsRepository],
  exports: [InstrumentsRepository],
})
export class InstrumentsModule {}
