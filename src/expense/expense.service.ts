import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expenses } from './expenses.schema';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class ExpensesService {
    constructor(@InjectModel(Expenses.name) private readonly expenseModel: Model<Expenses>) { }


    async createExpense(body: any, req: any) {
        try {
            body.date = new Date(body.date)
            body.initiator = req.user.username
            body.location = req.user.location;
            return await this.expenseModel.create(body);
        } catch (error) {
            errorLog(`error creating expenses ${error}`, "ERROR")
            throw new BadRequestException(error);
        }


    }

    async updateExpense(id: string, updateData: Partial<Expenses>) {
        try {
            const expense = await this.expenseModel.findById(id);
            if (!expense) {
                throw new BadRequestException(`Expense with id ${id} not found`);
            }
            for (const key in updateData) {
                if (updateData.hasOwnProperty(key)) {
                    expense[key] = updateData[key];
                }
            }
            return await expense.save();
        } catch (error) {
            errorLog(`error updating expenses ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async deleteExpense(id: string) {
        try {
            return await this.expenseModel.findByIdAndDelete(id);
        } catch (error) {
            errorLog(`error deleting expenses ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getExpenses(query: QueryDto, req: any) {
        const {
            filter = '{}',
            sort = '{}',
            skip = 0,
            select = '',
            limit = 10,
            startDate,
            endDate
        } = query;
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);

        if (!startDate || !endDate) {
            throw new BadRequestException(`Start date and end date are required`);
        }

        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(24, 59, 59, 999);

            parsedFilter.createdAt = { $gte: start, $lte: end };
            console.log(parsedFilter.approved)
            if (parsedFilter.approved == '') {
                delete parsedFilter.approved
            }
            if (parsedFilter.category == 'category' || parsedFilter.category == 'All') {
                delete parsedFilter.category
            }
            const dbExpenses = await this.expenseModel.find({ ...parsedFilter, location: req.user.location })
                .sort(parsedSort)
                .skip(Number(skip))
                .limit(Number(limit))
                .select(select)
                .exec()
            const expensesCount = await this.expenseModel.countDocuments({ ...parsedFilter, location: req.user.location })
            const result = { expense: dbExpenses, expensesCount: expensesCount }
            return result;
        } catch (error) {
            errorLog(`error reading all expenses ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async getTotalExpenses(query: QueryDto, req: any) {
        try {
            const {
                filter = '{}',
                sort = '{}',
                skip = 0,
                select = '',
                limit = 10,
                startDate,
                endDate
            } = query;
            const parsedFilter = JSON.parse(filter);
            const parsedSort = JSON.parse(sort);

            if (!startDate || !endDate) {
                throw new BadRequestException(`Start date and end date are required`);
            }

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Start of the startDate

            const end = new Date(endDate);
            end.setHours(24, 59, 59, 999);
            const result = await this.expenseModel.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end }, ...parsedFilter, location: req.user.location } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            return result[0]?.total || 0;
        } catch (error) {
            errorLog(`error getting  total expenses ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }
}
