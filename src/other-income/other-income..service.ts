import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { OtherIncomeCategory } from './other-incomes..cat.schema';
import { OtherIncome } from './other-income.entity';

@Injectable()
export class OtherIncomeCategoryService {
    constructor(@InjectModel(OtherIncomeCategory.name) private readonly otherIncomeCategoryModel: Model<OtherIncomeCategory>) { }


    async create(body: any, req: any) {
        try {
            body.initiator = req.user.username
            body.location = req.user.location;
            return await this.otherIncomeCategoryModel.create(body);
        } catch (error) {
            errorLog(`error creating otherIncome category ${error}`, "ERROR")
            throw new BadRequestException(error);
        }


    }

    async update(id: string, updateData: Partial<OtherIncome>) {
        try {
            const expense = await this.otherIncomeCategoryModel.findById(id);
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
            errorLog(`error updating otherIncome category${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async delete(id: string) {
        try {
            return await this.otherIncomeCategoryModel.findByIdAndDelete(id);
        } catch (error) {
            errorLog(`error deleting otherIncome category ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async findAll(req: any) {
        try {
            return await this.otherIncomeCategoryModel.find({ location: req.user.location }).exec()
        } catch (error) {
            errorLog(`error reading all otherIncome categories ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }


}
