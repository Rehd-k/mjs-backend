import { forwardRef, Module } from '@nestjs/common';
import { CashflowService } from './cashflow.service';
import { CashflowController } from './cashflow.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cashflow, CashflowSchema } from './cashflow.entity';
import { Purchase, PurchaseSchema } from 'src/purchases/purchases.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cashflow.name, schema: CashflowSchema }
    ])
  ],
  controllers: [CashflowController],
  providers: [CashflowService],
  exports: [CashflowService]
})
export class CashflowModule { }
