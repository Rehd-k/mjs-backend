import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
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

    async getSupplierDashboard(req
        : any
    ) {
        const pipeline: PipelineStage[] = [
            {

                $facet: {
                    topSuppliers: [
                        {
                            $match: {
                                location: req.user.location
                            }
                        },
                        { $sort: { amountSpent: -1 as 1 | -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                name: 1,
                                amountSpent: 1,
                                email: 1,
                                phone_number: 1,
                                address: 1
                            },
                        },
                    ],
                    latestAdditions: [
                        {
                            $match: {
                                location: req.user.location

                            }
                        },
                        { $sort: { createdAt: -1 as 1 | -1 } },
                        { $limit: 5 },

                        {
                            $project: {
                                name: 1,
                                createdAt: 1,
                                email: 1,
                                phone_number: 1,
                                address: 1
                            },
                        },
                    ],
                    statusSummary: [
                        {
                            $match: {
                                location: req.user.location
                            }
                        },
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                            },
                        },
                    ],
                },
            },
        ];

        const result = await this.supplierModel.aggregate(pipeline).exec();

        let status = {
            inactive: 0,
            active: 0
        };
        for (const element of result[0].statusSummary) {
            if (element._id == 'inactive') {
                status.inactive = element.count
            } else {
                status.active = element.count
            }
        }
        result[0].statusSummary = status;
        return result[0]
    }

    async addOrder(supplierId: Types.ObjectId, orderId: Types.ObjectId, amountSpent: number, paymentId: Types.ObjectId | null): Promise<any> {
        try {
            const supplier = await this.supplierModel.findById(supplierId);
            if (!supplier) {
                throw new BadRequestException('Supplier not found');
            }
            supplier.orders.push(orderId);
            supplier.amountSpent += amountSpent;
            if (paymentId) {
                supplier.payments.push(paymentId);
            }



            await supplier.save()
        } catch (error) {
            errorLog(`Error adding order to  supplier ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getSupplierDetails(supplierId: string): Promise<any> {
        const pipeline = [
            {
                $match: { _id: new Types.ObjectId(supplierId) }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phone_number: 1,
                    status: 1,
                    amountSpent: 1,
                    contactPerson: 1,
                    address: 1,
                    otherContacts: 1
                }
            }

        ];

        try {
            const suppliers = await this.supplierModel.aggregate(pipeline);
            return suppliers[0]
        } catch (error) {
            errorLog(`Error supplier details ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async updateSuplierById(id: string, data: any) {
  
        try {
            return this.supplierModel.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            errorLog(`error updating one users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }
}
