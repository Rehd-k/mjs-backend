import { Module } from '@nestjs/common';
import { CreditorsService } from './creditors.service';
import { CreditorsController } from './creditors.controller';

@Module({
  controllers: [CreditorsController],
  providers: [CreditorsService],
})
export class CreditorsModule {}
