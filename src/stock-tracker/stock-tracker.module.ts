import { Module } from '@nestjs/common';
import { StockTrackerService } from './stock-tracker.service';
import { StockTrackerController } from './stock-tracker.controller';

@Module({
  controllers: [StockTrackerController],
  providers: [StockTrackerService],
})
export class StockTrackerModule {}
