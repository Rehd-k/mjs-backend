import { Module } from '@nestjs/common';
import { StockFlowService } from './stock-flow.service';
import { StockFlowController } from './stock-flow.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StockFlow, StockFlowSchema } from './stock-flow.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockFlow.name, schema: StockFlowSchema },
    ])
  ],
  controllers: [StockFlowController],
  providers: [StockFlowService],
  exports : [StockFlowService]
})
export class StockFlowModule { }
