import { Module } from '@nestjs/common';
import { InwardPaymentsService } from './inward-payments.service';
import { InwardPaymentsController } from './inward-payments.controller';

@Module({
  controllers: [InwardPaymentsController],
  providers: [InwardPaymentsService],
})
export class InwardPaymentsModule {}
