import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier } from './supplier.schema';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class SupplierService {
    constructor(
        @InjectModel(Supplier.name) private readonly supplierModel: Model<Supplier>,

    ) { }

    async createSupplier(data: any, req): Promise<any> {
        try {
            data.location = req.user.location
            data.initiator = req.user.username
            const supplier = new this.supplierModel(data);
            return supplier.save();
        } catch (error) {
            errorLog(`Error creating supplier ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getAllSuppliers(query: QueryDto, req: any): Promise<any> {
        const {
            filter = '{}',
            sort = '{}',
            skip = 0,
            select = '',
        } = query;
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);

        try {
            return await this.supplierModel
                .find({ ...parsedFilter, location: req.user.location })
                .sort(parsedSort)
                .skip(Number(skip))
                .select(select)
                .exec()
        } catch (error) {
            errorLog(`Error getting all supplier ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async addOrder(supplierId: Types.ObjectId, orderId: Types.ObjectId): Promise<any> {
        try {
            const supplier = await this.supplierModel.findById(supplierId);
            if (!supplier) {
                throw new BadRequestException('Supplier not found');
            }
            supplier.orders.push(orderId);

            await supplier.save()
        } catch (error) {
            errorLog(`Error adding order to  supplier ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getSupplierDetails(supplierId: string): Promise<any> {
        try {
            return this.supplierModel.findById(supplierId).populate('orders.items.product').exec();
        } catch (error) {
            errorLog(`Error supplier details ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }
}
