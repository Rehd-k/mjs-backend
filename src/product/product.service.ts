import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './product.schema';
import { QueryDto } from './query.dto';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class ProductService {
    constructor(@InjectModel(Product.name) private productModel: Model<Product>) { }

    async create(createProductDto: any, req: any): Promise<Product> {
        try {
            createProductDto.location = req.user.location;
            createProductDto.title = createProductDto.title.toLowerCase();
            createProductDto.initiator = req.user.username;
            const createdProduct = new this.productModel(createProductDto);

            return await createdProduct.save();
        } catch (error) {
            errorLog(`Error createing objects ${error}`, "ERROR")
            throw new BadRequestException(error); 
        }

    }


    async findAll(query: QueryDto, req: any): Promise<{ products: Product[], totalDocuments: number }> {

        const {
            filter = '{}',
            sort = '{}',
            limit = 10,
            skip = 0,
            select = '',
        } = query;
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);
        // If the filter contains a 'barcode' key, set skip to 0
        if (parsedFilter && typeof parsedFilter === 'object' && 'barcode' in parsedFilter) {
            query.skip = 0;
            if (parsedFilter.barcode['$regex'])
                parsedFilter.barcode['$regex'] = parsedFilter.barcode['$regex'].toUpperCase();
        }
        try {


            const products = await this.productModel
                .find({ ...parsedFilter, location: req.user.location })
                .sort(parsedSort)
                .skip(Number(skip))
                .limit(Number(limit))
                .select(select)
                .exec();


            const totalDocuments = await this.productModel
                .countDocuments({ ...parsedFilter, location: req.user.location })
                .exec();

            return { products, totalDocuments };
        } catch (error) {
            errorLog('Error in findAll Products:', error)

            throw new InternalServerErrorException(error);
        }
    }

    async findOne(id: string) {
        try {
            return await this.productModel.findById(id).exec();
        } catch (error) {
            errorLog(`Error finding this producs ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async update(id: Types.ObjectId, updateProductDto: any) {
        try {
            return await this.productModel.findByIdAndUpdate(id, updateProductDto).exec();
        } catch (error) {
            errorLog(`Error updating products ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async increaseAmount(id: Types.ObjectId, amount: number) {
        try {
            const product = await this.productModel.findById(id).exec();
            if (!product) {
                throw new BadRequestException('product not found');
            }
            let dbquantity = product.quantity
            let newquantity = dbquantity + amount
            product.quantity = newquantity;
            return await product.save();
        } catch (error) {
            errorLog(`Error increacing amount ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }


    async decreaseAmount(id: string, amount: number): Promise<Product> {
        try {
            const product = await this.productModel.findById(id).exec();
            if (!product) {
                throw new BadRequestException('product not found');
            }
            product.quantity -= amount;
            return await product.save();
        } catch (error) {
            errorLog(`Error decreasing amount ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async remove(id: string) {
        try {
            return await this.productModel.findByIdAndDelete(id).exec();
        } catch (error) {
            errorLog(`Error removing product ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }
}
