import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryService } from 'src/product/inventory.service';
import { Sale } from './sales.schema';
import { QueryDto } from 'src/product/query.dto';
import { PurchasesService } from 'src/purchases/purchases.service';
import { FilterQuery } from 'mongoose';
import { CustomerService } from 'src/customer/customer.service';
import { ActivityService } from 'src/activity/activity.service';
import { errorLog } from 'src/helpers/do_loggers';



@Injectable()
export class SalesService {
    constructor(
        @Inject(forwardRef(() => InventoryService)) private inventoryService: InventoryService,
        @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
        private activityService: ActivityService,
        private customerService: CustomerService,
        private purchaseService: PurchasesService,
    ) { }

    async doSell(sellData: any, req: any): Promise<any> {
        let qunt_to_sell = 0;
        let profit = 0;
        try {

            for (const element of sellData.products) {

                qunt_to_sell = element.quantity
                element.breakdown = [];
                try {
                    while (qunt_to_sell > 0) {
                        await handle_break_down(element, this.purchaseService);
                    }
                    for (const el of element.breakdown) {
                        profit = profit + el.total_profit
                    }
                } catch (error) {
                    errorLog(`Error crating sell brakedown ${error}`, "ERROR")
                    throw new BadRequestException(error);
                }
            }


            sellData.profit = profit;
            sellData.handler = req.user.username;
            sellData.totalAmount = sellData.cash + sellData.card + sellData.transfer
            sellData.location = req.user.location
            sellData.transactionDate = new Date(sellData.transactionDate)
            const data = await this.saleModel.create(sellData);

            for (const element of data.products) {
                await this.inventoryService.deductStock(element._id as any, element.quantity, req)
                await this.inventoryService.addToSold(element._id as any, element.quantity)
            }
            if (sellData.customer && sellData.customer !== '') {

                await this.customerService.addOrder(sellData.customer, data._id, data.totalAmount)
            }
            await this.activityService.logAction(`${req.user.userId}`, req.user.username, 'Made Sales', `Transaction Id ${data.transactionId}`)
            return data.populate('customer bank')
        } catch (error) {
            errorLog(error, "ERROR")
            throw new InternalServerErrorException(error)
        }





        async function handle_break_down(element: any, purchaseService: PurchasesService) {
            const purchase = await purchaseService.findFirstUnsoldPurchase(element._id, req);
            if (!purchase)
                throw new Error(`No purchase found for product ${element._id}`)
            const sold = purchase.sold.reduce((sum, item) => sum + (item.amount || 0), 0);
            const good_avalable_for_sale = purchase.quantity - sold;
            if (good_avalable_for_sale >= qunt_to_sell) {
                const breakdown = {
                    orderBatch: purchase._id,
                    quantity: qunt_to_sell,
                    costPrice: purchase.price,
                    profit: element.price - purchase.price,
                    total_profit: (element.price - purchase.price) * qunt_to_sell,
                };
                element.breakdown.push(breakdown);
                purchase.sold.push({ amount: qunt_to_sell, price: element.price });
                qunt_to_sell = 0
                await purchase.save();
            } else {
                const breakdown = {
                    orderBatch: purchase._id,
                    quantity: good_avalable_for_sale,
                    costPrice: purchase.price,
                    profit: element.price - purchase.price,
                    total_profit: (element.price - purchase.price) * good_avalable_for_sale,
                };

                element.breakdown = element.breakdown.push(breakdown);
                purchase.sold.push({ amount: good_avalable_for_sale, price: element.price });
                qunt_to_sell = qunt_to_sell - good_avalable_for_sale
                await purchase.save();
            }
        }
    }

    async getSingleProductSaleData(prodictId: string, query: QueryDto, req: any) {
        const {
            filter = '{}',
        } = query;
        const parsedFilter = JSON.parse(filter);

        const now = new Date();
        let startDate, endDate, groupBy;
        switch (parsedFilter.sorter) {
            case "Today":
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(24, 59, 59, 999));
                groupBy = {
                    for: {
                        $add: [
                            {
                                $divide: [
                                    { $subtract: [{ $hour: "$transactionDate" }, { $mod: [{ $hour: "$transactionDate" }, 2] }] },
                                    2
                                ]
                            },
                            1
                        ]
                    }
                };
                break;
            case "This Week":
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                groupBy = { for: { $dayOfWeek: "$transactionDate" } };
                break;
            case "Last 7 Days":
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date();
                endDate.setHours(24, 59, 59, 999);

                groupBy = {
                    for: {
                        $subtract: [
                            {
                                $add: [
                                    {
                                        $dateDiff: {
                                            startDate: startDate,
                                            endDate: "$transactionDate",
                                            unit: "day"
                                        }
                                    },
                                    1
                                ]
                            },
                            1
                        ]
                    }
                };
                break;
            case "Last Week":
                startDate = new Date(now.setDate(now.getDate() - now.getDay() - 7));
                endDate = new Date(now.setDate(now.getDate() - now.getDay() - 1));
                groupBy = { for: { $dayOfWeek: "$transactionDate" } };
                break;
            case "This Month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                groupBy = { for: { $dayOfMonth: "$transactionDate" } };
                break;
            case "Last Month":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                groupBy = { for: { $dayOfMonth: "$transactionDate" } };
                break;
            case "First Quarter":
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 3, 0);
                groupBy = { for: { $month: "$transactionDate" } };
                break;
            case "Second Quarter":
                startDate = new Date(now.getFullYear(), 3, 1);
                endDate = new Date(now.getFullYear(), 6, 0);
                groupBy = { for: { $month: "$transactionDate" } };
                break;
            case "Third Quarter":
                startDate = new Date(now.getFullYear(), 6, 1);
                endDate = new Date(now.getFullYear(), 9, 0);
                groupBy = { for: { $month: "$transactionDate" } };
                break;
            case "Fourth Quarter":
                startDate = new Date(now.getFullYear(), 9, 1);
                endDate = new Date(now.getFullYear(), 12, 0);
                groupBy = { for: { $month: "$transactionDate" } };
                break;
            case "This Year":
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                groupBy = { for: { $month: "$transactionDate" } };
                break;
            default:
                throw new Error("Invalid option");
        }

        try {

            const sales = await this.saleModel.aggregate([
                {
                    $match: {
                        "products._id": prodictId,
                        transactionDate: { $gte: startDate, $lte: endDate },
                        location: req.user.location
                    },

                },
                { $unwind: "$products" },

                { $group: { _id: groupBy, totalSales: { $sum: "$products.total" } } },
                { $sort: { "_id": 1 } },
                { $project: { _id: 0, for: "$_id.for", totalSales: 1 } }
            ]);
            return sales;
        } catch (error) {
            errorLog(`Error gettig single sale data ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async doSearch(query: string, req: any): Promise<Sale[]> {
        const filterQuery: FilterQuery<Sale> = {};
        const searchQuery = { $text: { $search: query } };
        try {
            return await this.saleModel.find({ ...searchQuery, location: req.user.location }).exec();
        } catch (error) {
            errorLog(`Error searching ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async findAll(query: QueryDto, req: any) {
        const {
            filter = '{}',
            sort = '{}',
            skip = 0,
            select = '',
            limit = 10,
        } = query;

        // --- 1. Initial Filter and Parameter Setup (Largely unchanged) ---
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);

        if (!query.startDate || !query.endDate) {
            throw new BadRequestException('Start date and end date are required for this query');
        }

        try {
            const startDate = new Date(query.startDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999); // Corrected: 24:00 becomes 00:00 of the next day

            parsedFilter.transactionDate = { $gte: startDate, $lte: endDate };

            if (req.user.role === 'cashier' || req.user.role === 'staff') {
                parsedFilter.handler = req.user.username;
            }

            // Special condition for barcode lookup
            if (parsedFilter?.barcodeId) {
                query.skip = 0; // Reset pagination for specific lookup
                delete parsedFilter.transactionDate;
            }

            if (parsedFilter.handler === '') delete parsedFilter.handler;
            if (parsedFilter.paymentMethod === '') delete parsedFilter.paymentMethod;

            // --- 2. Construct the Single Aggregation Pipeline ---
            const aggregationPipeline: any[] = [
                // Stage 1: Match documents based on all filters
                {
                    $match: { ...parsedFilter, location: req.user.location }
                },
            ];

            // Add sorting if provided, important for consistent pagination
            if (Object.keys(parsedSort).length > 0) {
                aggregationPipeline.push({ $sort: parsedSort });
            }

            // Stage 2: Use $facet to run multiple aggregation pipelines on the same set of matched documents
            aggregationPipeline.push({
                $facet: {
                    // Pipeline 1: Calculate metadata (summary and total count)
                    metadata: [
                        {
                            $group: {
                                _id: null,
                                totalAmount: { $sum: "$totalAmount" },
                                totalDiscount: { $sum: "$discount" },
                                totalTransfer: { $sum: "$transfer" },
                                totalCard: { $sum: "$card" },
                                totalCash: { $sum: "$cash" },
                                totalProfit: { $sum: "$profit" },
                                totalDocuments: { $sum: 1 } // Count documents in the same group pass
                            }
                        }
                    ],
                    // Pipeline 2: Get the actual paginated data for the current page
                    sales: [
                        { $skip: Number(skip) },
                        { $limit: Number(limit) },
                        // Replicate Mongoose's .populate() using $lookup
                        {
                            $lookup: {
                                from: 'customers', // The actual collection name for customers
                                localField: 'customer',
                                foreignField: '_id',
                                as: 'customerInfo'
                            }
                        },
                        {
                            $lookup: {
                                from: 'banks', // The actual collection name for banks
                                localField: 'bank',
                                foreignField: '_id',
                                as: 'bankInfo'
                            }
                        },
                        // $unwind to deconstruct the array field from the $lookup result
                        { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
                        { $unwind: { path: '$bankInfo', preserveNullAndEmptyArrays: true } },
                        // Replace the original fields with the populated ones
                        {
                            $addFields: {
                                customer: "$customerInfo",
                                bank: "$bankInfo"
                            }
                        },
                        // Optional: Project fields similar to Mongoose's .select()
                        // This part can be enhanced if you need to parse the 'select' string
                    ],
                    // Pipeline 3: Get all unique handlers for the matched results
                    uniqueHandlers: [
                        { $group: { _id: '$handler' } },
                        { $group: { _id: null, handlers: { $push: '$_id' } } }
                    ]
                }
            });

            // --- 3. Execute the Single Query ---
            const result = await this.saleModel.aggregate(aggregationPipeline);

            // --- 4. Process and Return the Results ---
            const data = result[0];
            const metadata = data.metadata[0];

            const sales = data.sales;
            const totalDocuments = metadata ? metadata.totalDocuments : 0;
            const handlers = data.uniqueHandlers.length > 0 ? data.uniqueHandlers[0].handlers.filter(h => h) : [];

            const summary = metadata ? {
                totalAmount: metadata.totalAmount,
                totalDiscount: metadata.totalDiscount,
                totalTransfer: metadata.totalTransfer,
                totalCard: metadata.totalCard,
                totalCash: metadata.totalCash,
                totalProfit: metadata.totalProfit,
            } : {
                totalAmount: 0, totalDiscount: 0, totalTransfer: 0,
                totalCard: 0, totalCash: 0, totalProfit: 0
            };

            return { sales, handlers, totalDocuments, summary };

        } catch (error) {
            errorLog(error, "ERROR");
            throw new InternalServerErrorException(error);
        }
    }

    // async findAll(query: QueryDto, req: any) {
    //     const {
    //         filter = '{}',
    //         sort = '{}',
    //         skip = 0,
    //         select = '',
    //         limit = 10
    //     } = query;
    //     const parsedFilter = JSON.parse(filter);
    //     const parsedSort = JSON.parse(sort);

    //     if (!query.startDate || !query.endDate)
    //         throw new BadRequestException(
    //             'Start date and end date are required for this query')


    //     try {
    //         const startDate = new Date(query.startDate);
    //         startDate.setHours(0, 0, 0, 0); // Start of the startDate

    //         const endDate = new Date(query.endDate);
    //         endDate.setHours(24, 59, 59, 999); // End of the endDate 

    //         parsedFilter.transactionDate = { $gte: startDate, $lte: endDate };

    //         if (req.user.role === 'cashier') {
    //             parsedFilter.handler = req.user.username
    //         }

    //         if (req.user.role === 'staff') {
    //             parsedFilter.handler = req.user.username
    //         }

    //         if (parsedFilter && typeof parsedFilter === 'object' && 'barcodeId' in parsedFilter) {
    //             query.skip = 0;
    //             delete parsedFilter.transactionDate
    //         }

    //         if (parsedFilter.handler === '') {
    //             delete parsedFilter.handler
    //         }


    //         if (parsedFilter.paymentMethod === '') {
    //             delete parsedFilter.paymentMethod
    //         }

    //         const totals = await this.saleModel.aggregate([
    //             {
    //                 $match: { ...parsedFilter, location: req.user.location }
    //             },
    //             {
    //                 $group: {
    //                     _id: null,
    //                     totalAmount: { $sum: "$totalAmount" },
    //                     totalDiscount: { $sum: "$discount" },
    //                     totalTransfer: { $sum: "$transfer" },
    //                     totalCard: { $sum: "$card" },
    //                     totalCash: { $sum: "$cash" },
    //                     totalProfit: { $sum: "$profit" }
    //                 }
    //             }
    //         ]);

    //         const summary = totals.length > 0 ? totals[0] : {
    //             totalAmount: 0,
    //             totalDiscount: 0,
    //             totalTransfer: 0,
    //             totalCard: 0,
    //             totalCash: 0,
    //             totalProfit: 0
    //         };





    //         const sales = await this.saleModel
    //             .find({ ...parsedFilter, location: req.user.location })
    //             .sort(parsedSort)
    //             .skip(Number(skip))
    //             .limit(Number(limit))
    //             .select(select)
    //             .populate('customer bank')
    //             .exec();


    //         const totalDocuments = await this.saleModel
    //             .countDocuments({ ...parsedFilter, location: req.user.location }); // Count total documents matching the filter


    //         const forHandlers = await this.saleModel
    //             .find({ transactionDate: { $gte: startDate, $lte: endDate }, location: req.user.location });


    //         const handlersSet = new Set<string>();
    //         forHandlers.forEach(sale => handlersSet.add(sale.handler));
    //         const handlers = Array.from(handlersSet);


    //         return { sales, handlers, totalDocuments, summary };
    //     } catch (error) {
    //         errorLog(error, "ERROR")
    //         throw new InternalServerErrorException(error)
    //     }
    // }

    async findOne(id: string): Promise<Sale | null> {
        try {
            return await this.saleModel.findById(id).populate('customer bank').exec();
        } catch (error) {
            errorLog(`Error finding one ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async update(id: string, updateData: any, req: any): Promise<Sale> {

        try {
            const sale = await this.saleModel.findById(id)

            if (!sale) {
                throw new BadRequestException(`Sale with id ${id} not found`);
            }

            for (const key in updateData) {

                if (updateData.hasOwnProperty(key) && sale[key] !== undefined) {
                    sale[key] = updateData[key];
                }
            }
            const data = await sale.save()
            await this.activityService.logAction(`${req.user.userId}`, req.user.username, 'Update Sales', `Updated sale with transaction Id ${data.transactionId} with ${JSON.stringify(updateData)}`)
            return data
        } catch (error) {
            errorLog(`Error updaing one ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async return(id: string, data: any, req: any) {
        try {
            if (!data.handler) {
                for (const element of data.returns) {
                    element.handler = req.user.username
                }
            } else {
                for (const element of data.returns) {
                    element.handler = data.handler
                }
            }
            const sale = await this.saleModel.findOne({ _id: id })
            if (!sale) {
                throw new BadRequestException(`Sale with id ${id} not found`);
            }
            sale.returns = sale.returns.concat(data.returns)
            let returns = data.returns
            let cart = sale.products

            for (const returnItem of returns) {
                const productIndex = cart.findIndex(product => product._id.toString() === returnItem.productId.toString());
                if (productIndex !== -1) {

                    let qunt_to_remove = returnItem.quantity

                    while (qunt_to_remove > 0) {
                        let batch = returnItem.batches[0]
                        if (batch.quantity <= qunt_to_remove) {
                            await this.purchaseService.editSoldQuantity(batch.orderBatch, batch.quantity, cart[productIndex].price)
                            returnItem.batches.splice(0, 1)
                            qunt_to_remove -= batch.quantity
                        } else {
                            await this.purchaseService.editSoldQuantity(batch.orderBatch, qunt_to_remove, cart[productIndex].price)
                            returnItem.batches[0].quantity -= qunt_to_remove
                            returnItem.batches[0].total_profit = returnItem.batches[0].quantity * returnItem.batches[0].profit
                            qunt_to_remove = 0
                        }
                    }

                    cart[productIndex].breakdown = returnItem.batches
                    cart[productIndex].quantity -= returnItem.quantity;
                    cart[productIndex].total = cart[productIndex].quantity * cart[productIndex].price;
                    if (cart[productIndex].quantity < 1) {
                        cart.splice(productIndex, 1);
                    }
                }
            }
            sale.totalAmount = cart.reduce((acc, product) => acc + product.total, 0);
            let profit = 0;
            for (const element of sale.products) {
                for (const el of element.breakdown) {
                    profit = profit + el.total_profit
                }
            }

            sale.profit = profit


            await sale.save();
            for (const element of data.returns) {
                await this.inventoryService.restockProduct(element.productId, element.quantity)
                await this.inventoryService.deductFromSold(element._id as any, element.quantity)
            }
            await this.activityService.logAction(`${req.user.userId}`, req.user.username, 'Made Returns', `Made returns on transaction with Id ${data.transactionId}`)
            return sale;
        } catch (e) {
            errorLog(`Error returnig one ${e}`, "ERROR")
            throw new BadRequestException(e);
        }
    }

    async delete(id: string, req: any): Promise<any> {
        try {
            const deleted = await this.saleModel.findByIdAndDelete(id).exec();
            await this.activityService.logAction(`${req.user.userId}`, req.user.username, 'Deleted Transaction', `Made returns on transaction with Id ${id}`)
            return deleted
        } catch (error) {
            errorLog(`Error deleting one ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async getDashboardData(id: string, startDate: Date, endDate: Date, req: any): Promise<{ totalAmount: number, totalPrice: number }[]> {
        if (!startDate) {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0); // Start of today
        }
        if (!endDate) {
            endDate = new Date();
            endDate.setHours(24, 59, 59, 999); // End of today
        }
        const sales = await this.saleModel.aggregate([
            { $unwind: "$products" },
            {
                $match: {
                    "products._id": id,
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    location: req.user.location
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$products.quantity" },  // Sum of all amounts
                    totalPrice: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },

                    sales_by_date: {
                        $push: {
                            date: "$createdAt",
                            amount: "$products.quantity"
                        }
                    }
                }
            }
        ]);
        return sales;
    }

    async getSalesData(query: QueryDto): Promise<any> {
    };

    formatPhoneNumber(phone: string): string {
        // Remove non-digit characters
        const digits = phone.replace(/\D/g, '');

        if (digits.startsWith('0')) {
            return `234${digits.substring(1)}@c.us`;
        } else if (digits.startsWith('234')) {
            return `${digits}@c.us`;
        } else {
            throw new Error('Invalid Nigerian phone number');
        }
    }


}
