import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryDto } from 'src/product/query.dto';
import { Customer } from './customer.schema';
import { error } from 'console';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class CustomerService {
    constructor(
        @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,

    ) { }

    async createCustomer(data: any, req: any): Promise<any> {
        try {
            const customer = new this.customerModel(data);

            if (customer.email) {
                const existing = await this.customerModel.findOne({ email: customer.email })
                if (existing) {
                    throw Error('Email Already Exists')
                }
            }
            customer.initiator = req.user.username;
            customer.location = req.user.location;
            return customer.save();
        } catch (error) {
            errorLog(`Error create new   cusomter: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getAllCustomers(query: QueryDto, req): Promise<any> {
        const {
            filter = '{}',
            sort = '{}',
            skip = 0,
            select = '',
        } = query;
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);

        if (parsedFilter.nameOrPhonenumber) {
            const nameOrPhonenumber = parsedFilter.nameOrPhonenumber;

            parsedFilter.$or = [
                { name: { $regex: new RegExp(nameOrPhonenumber, "i") } },
                { phone_number: { $regex: new RegExp(nameOrPhonenumber, "i") } }
            ];
            delete parsedFilter.nameOrPhonenumber;
        }
        try {
            return await this.customerModel
                .find({ ...parsedFilter, location: req.user.location })
                .sort(parsedSort)
                .limit(10)
                .skip(Number(skip))
                .select(select)
                .exec()
        } catch (error) {
            errorLog(`Error getting all   cusomter: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async addOrder(customerId: Types.ObjectId, orderId: Types.ObjectId, total_spent: number): Promise<any> {
        try {
            const customer = await this.customerModel.findById(customerId);
            if (!customer) {
                throw new BadRequestException('Customer not found');
            }
            customer.orders.push(orderId);
            customer.total_spent += total_spent;

            await customer.save()
        } catch (error) {
            errorLog(`Error creating order: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async addReturns(customerId: Types.ObjectId, orderId: Types.ObjectId): Promise<any> {
        try {
            const customer = await this.customerModel.findById(customerId);
            if (!customer) {
                throw new BadRequestException('Customer not found');
            }
            customer.returns.push(orderId);

            await customer.save()
        } catch (error) {
            errorLog(`Error returning an order: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getCustomerDetails(customerId: string): Promise<any> {
        try {
            return this.customerModel.findById(customerId).populate('orders.returns').exec();
        } catch (error) {
            errorLog(`Error returning an order: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }
    async updateCustomer(customerId: string, updateData: any): Promise<any> {
        const customer = await this.customerModel.findById(customerId);
        if (!customer) {
            errorLog(`Customer not found`, "ERROR")
            throw new BadRequestException(error);
        }

        try {
            for (const key in updateData) {
                if (updateData.hasOwnProperty(key)) {
                    if (key === 'increase' || key === 'decrease') {
                        for (const field in updateData[key]) {
                            if (updateData[key].hasOwnProperty(field)) {
                                if (key === 'increase') {
                                    customer[field] += updateData[key][field];
                                } else if (key === 'decrease') {
                                    customer[field] -= updateData[key][field];
                                }
                            }
                        }
                    } else {
                        customer[key] = updateData[key];
                    }
                }
            }

            return customer.save();
        } catch (error) {
            errorLog(`error updating customers ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async deleteCustomer(customerId: string): Promise<any> {
        try {
            return this.customerModel.findByIdAndDelete(customerId).exec();
        } catch (error) {
            errorLog(`error deleting customers ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }


}
