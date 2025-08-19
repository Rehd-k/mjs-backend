import { Module } from '@nestjs/common';
import { ExpensesService } from './expense.service';
import { ExpensesController } from './expense.controller';
import { Expenses, ExpensesSchema } from './expenses.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expenses.name, schema: ExpensesSchema }])
  ],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  // exports: [ExpensesService]
})
export class ExpenseModule { }
