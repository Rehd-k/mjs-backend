import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Category } from './category.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class CategoryService {
    constructor(@InjectModel(Category.name) private readonly categoryModel: Model<Category>) { }

    async createCategory(category: any, req: any) {
        try {
            category.location = req.user.location;
            category.initiator = req.user.username;
            return await this.categoryModel.create(category);
        } catch (error) {
            errorLog(`Error create  categories: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }


    }

    async getCategorys(query: QueryDto, req) {
        try {
            const {
                filter = '{}',
                sort = '{}',
                limit = 10,
                skip = 0,
                select = '',
            } = query;
            const parsedFilter = JSON.parse(filter);
            const parsedSort = JSON.parse(sort);
            return await this.categoryModel.find({ ...parsedFilter, location: req.user.location })
                .sort({
                    title: 1
                })
                .skip(Number(skip))
                // .limit(Number(limit))
                .select(select)
                .exec()
        } catch (error) {
            errorLog(`Error getting  categories: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getCategoryById(CategoryId: string) {
        try {
            return await this.categoryModel.findById(CategoryId);
        } catch (error) {
            errorLog(`Error deleting bank: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async update(id: string, updateProductDto: any) {
        try {
            return await this.categoryModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();
        } catch (error) {
            errorLog(`Error updateing category: ${error}`, "ERROR")
            throw new InternalServerErrorException(error);
        }
    }

    async remove(id: string) {
        try {
            return await this.categoryModel.findByIdAndDelete(id).exec();
        } catch (error) {
            errorLog(`Error remove  categories: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }
}
