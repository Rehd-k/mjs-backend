import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expenses } from './expenses.schema';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';
import { ExpensesCategory } from './expenses.cat.schema';

@Injectable()
export class ExpensesCategoryService {
    constructor(@InjectModel(ExpensesCategory.name) private readonly expensesCategoryModel: Model<ExpensesCategory>) { }


    async create(body: any, req: any) {
        try {
            body.initiator = req.user.username
            body.location = req.user.location;
            return await this.expensesCategoryModel.create(body);
        } catch (error) {
            errorLog(`error creating expenses category ${error}`, "ERROR")
            throw new BadRequestException(error);
        }


    }

    async update(id: string, updateData: Partial<Expenses>) {
        try {
            const expense = await this.expensesCategoryModel.findById(id);
            if (!expense) {
                throw new BadRequestException(`Expense category with id ${id} not found`);
            }
            for (const key in updateData) {
                if (updateData.hasOwnProperty(key)) {
                    expense[key] = updateData[key];
                }
            }
            return await expense.save();
        } catch (error) {
            errorLog(`error updating expenses category${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async delete(id: string) {
        try {
            return await this.expensesCategoryModel.findByIdAndDelete(id);
        } catch (error) {
            errorLog(`error deleting expenses category ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async findAll(req: any) {
        try {
            return await this.expensesCategoryModel.find({ location: req.user.location }).exec()
        } catch (error) {
            errorLog(`error reading all expenses categories ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }


}
