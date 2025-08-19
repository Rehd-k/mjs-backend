import { Module } from '@nestjs/common';
import { OutwardPaymentsService } from './outward-payments.service';
import { OutwardPaymentsController } from './outward-payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OutwardPayment, OutwardPaymentSchema } from './outward-payment.entity';
import { Purchase, PurchaseSchema } from 'src/purchases/purchases.schema';
import { PurchasesModule } from 'src/purchases/purchases.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutwardPayment.name, schema: OutwardPaymentSchema }
    ]),
    PurchasesModule
  ],
  controllers: [OutwardPaymentsController],
  providers: [OutwardPaymentsService],
})
export class OutwardPaymentsModule { }
