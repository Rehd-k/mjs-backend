import { Module } from '@nestjs/common';
import { OtherIncomeService } from './other-income.service';
import { OtherIncomeController } from './other-income.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OtherIncome, OtherIncomeSchema } from './other-income.entity';
import { OtherIncomeCategory, OtherIncomeCategorySchema } from './other-incomes..cat.schema';
import { CashflowModule } from 'src/cashflow/cashflow.module';
import { OtherIncomeCategoryService } from './other-income..service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OtherIncome.name, schema: OtherIncomeSchema },
      { name: OtherIncomeCategory.name, schema: OtherIncomeCategorySchema }]),
    CashflowModule
  ],
  controllers: [OtherIncomeController],
  providers: [OtherIncomeService, OtherIncomeCategoryService],
})
export class OtherIncomeModule { }
