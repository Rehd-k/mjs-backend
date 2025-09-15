import { Module } from '@nestjs/common';
import { ExpensesService } from './expense.service';
import { ExpensesController } from './expense.controller';
import { Expenses, ExpensesSchema } from './expenses.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpensesCategory, ExpensesCategorySchema } from './expenses.cat.schema';
import { ExpensesCategoryService } from './exp.cat.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expenses.name, schema: ExpensesSchema, },
      { name: ExpensesCategory.name, schema: ExpensesCategorySchema }])
  ],
  providers: [ExpensesService, ExpensesCategoryService],
  controllers: [ExpensesController],
  // exports: [ExpensesService]
})
export class ExpenseModule { }
