import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Purchase } from './purchases.schema';
import { SupplierService } from 'src/supplier/supplier.service';
import { ProductService } from 'src/product/product.service';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';
import { Department } from 'src/department/entities/department.entity';
import { CashflowService } from 'src/cashflow/cashflow.service';
import { StockFlowService } from 'src/stock-flow/stock-flow.service';


// Remeber to handle for returns outwards
// goods would leave a particular batch nothing spectacuolar , just reduce stock and increase money entering inward oaymet
@Injectable()
export class PurchasesService {
    constructor(
        @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
        private supplierService: SupplierService,
        @Inject(forwardRef(() => ProductService)) private productService: ProductService,
        @InjectModel(Department.name) private departmentModel: Model<Department>,
        private readonly stockFlowService: StockFlowService,

        private cashflowService: CashflowService
    ) { }

    async create(createPurchaseDto: any, req: any): Promise<Purchase> {
        try {
            createPurchaseDto.location = req.user.location;
            createPurchaseDto.initiator = req.user.username;
            const createdPurchase = new this.purchaseModel(createPurchaseDto);
            const product = await this.productService.findOne(createdPurchase.productId.toString());

            if (!product)
                throw new BadRequestException('Product Not Found')

            if (createdPurchase.status === 'Delivered') {

                product.quantity = product.quantity + Number(createdPurchase.quantity);
                product.lowStock = product.quantity <= product.roq;

                const mainDepartment = await this.departmentModel.findOne({ _id: createdPurchase.dropOfLocation })

                if (!mainDepartment) {
                    throw new Error('This Drop Of Point Does not Exist  in Facility, Please Create A Drop Of Point And Try Again')
                }
                const departmentProduct = mainDepartment.finishedGoods.findIndex((res) => {

                    return res.productId.toString() == product._id
                })
         
                if (departmentProduct == -1) {
                    mainDepartment.finishedGoods.push(
                        {
                            title: product.title,
                            productId: new mongoose.Types.ObjectId(product._id as string),
                            quantity: Number(createdPurchase.quantity),
                            unitCost: Number(createdPurchase.totalPayable) / Number(createdPurchase.quantity),
                            cost: Number(createdPurchase.totalPayable)
                        }
                    )
                } else {
                    mainDepartment.finishedGoods[departmentProduct].quantity = mainDepartment.finishedGoods[departmentProduct].quantity + Number(createdPurchase.quantity)
                }

                await Promise.all([mainDepartment.save(), product.save()]);
                await this.stockFlowService.create('Purchases', new Types.ObjectId(product._id as string), Number(createdPurchase.quantity), null, mainDepartment._id, 'in', new Date(Date.now()), req.user.username, req.user.location)

            }
            const order = await createdPurchase.save();

            if (createdPurchase.debt < createdPurchase.totalPayable) {
                let title = `Purchase Payment ${product.title}`;
                let paymentFor = createdPurchase._id;
                let cash = createdPurchase.cash;
                let bank = createdPurchase.bank;
                let type = 'out';
                let moneyFrom = createdPurchase.moneyFrom;
                let transactionDate = createdPurchase.purchaseDate;
                let initiator = req.user.username;
                let location = req.user.location;

                let cashFlow = await this.cashflowService.createPayment(
                    title,
                    paymentFor.toString(),
                    cash,
                    bank,
                    type,
                    moneyFrom,
                    transactionDate,
                    initiator,
                    location
                );
                if (createdPurchase.supplier && cashFlow) {
                    await this.supplierService.addOrder(createdPurchase.supplier, order._id, createdPurchase.totalPayable, cashFlow._id);
                }
            }
            if (createdPurchase.supplier) {
                await this.supplierService.addOrder(createdPurchase.supplier, order._id, createdPurchase.totalPayable, null);

            }
            return order
        } catch (error) {
            errorLog(`Failed to create purchase ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async updatePurchasePayment(createCashflowDto: any, req: any) {
        try {
            const purchase = await this.purchaseModel.findById(createCashflowDto.paymentFor);
            if (!purchase) {
                throw new BadRequestException('Product not found');
            }
            purchase.debt = purchase.debt - (createCashflowDto.cash + createCashflowDto.bank);
            if (createCashflowDto.cash > 0) {
                purchase.cash = purchase.cash + createCashflowDto.cash;
            }
            if (createCashflowDto.bank > 0) {
                purchase.bank = purchase.bank + createCashflowDto.bank;
            }
            let title = 'Purchase Payment';
            let paymentFor = purchase._id.toString();
            let cash = createCashflowDto.cash;
            let bank = createCashflowDto.bank;
            let type = 'out';
            let moneyFrom = createCashflowDto.moneyFrom;
            let transactionDate = createCashflowDto.transactionDate;
            let initiator = req.user.initiator;
            let location = req.user.location;

            const payment = await this.cashflowService.createPayment(
                title,
                paymentFor,
                cash,
                bank,
                type,
                moneyFrom,
                transactionDate,
                initiator,
                location,
            )

            purchase.payments.push(payment._id)
            const updatedPurchase = await purchase.save()
            return updatedPurchase
        } catch (error) {
            errorLog(`Failed to create purchase ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getDashboardData(id: string) {
        const pipeline = [
            { $match: { productId: id } },

            {
                $addFields: {
                    // Prevent division by zero
                    unitPrice: {
                        $cond: [
                            { $eq: ["$quantity", 0] },
                            0,
                            { $divide: ["$total", "$quantity"] }
                        ]
                    },

                    // Total sold
                    totalSoldAmount: { $sum: "$sold.amount" },
                    totalSoldValue: {
                        $sum: {
                            $map: {
                                input: "$sold",
                                as: "s",
                                in: { $multiply: ["$$s.amount", "$$s.price"] }
                            }
                        }
                    },

                    // Damaged
                    totalDamagedQuantity: {
                        $cond: [
                            { $isArray: "$damagedGoods" },
                            { $sum: "$damagedGoods.quantity" },
                            "$damagedGoods.quantity"
                        ]
                    },
                    totalDamagedValue: {
                        $cond: [
                            { $isArray: "$damagedGoods" },
                            {
                                $sum: {
                                    $map: {
                                        input: "$damagedGoods",
                                        as: "d",
                                        in: { $multiply: ["$$d.quantity", "$unitPrice"] }
                                    }
                                }
                            },
                            { $multiply: ["$damagedGoods.quantity", "$unitPrice"] }
                        ]
                    },

                    // Expired
                    totalExpiredQuantity: {
                        $cond: [
                            { $isArray: "$damagedGoods" },
                            {
                                $sum: {
                                    $map: {
                                        input: "$damagedGoods",
                                        as: "d",
                                        in: {
                                            $cond: [{ $eq: ["$$d.type", "expired"] }, "$$d.quantity", 0]
                                        }
                                    }
                                }
                            },
                            {
                                $cond: [
                                    { $eq: ["$damagedGoods.type", "expired"] },
                                    "$damagedGoods.quantity",
                                    0
                                ]
                            }
                        ]
                    },
                    totalExpiredValue: {
                        $cond: [
                            { $isArray: "$damagedGoods" },
                            {
                                $sum: {
                                    $map: {
                                        input: "$damagedGoods",
                                        as: "d",
                                        in: {
                                            $cond: [
                                                { $eq: ["$$d.type", "expired"] },
                                                { $multiply: ["$$d.quantity", "$unitPrice"] },
                                                0
                                            ]
                                        }
                                    }
                                }
                            },
                            {
                                $cond: [
                                    { $eq: ["$damagedGoods.type", "expired"] },
                                    { $multiply: ["$damagedGoods.quantity", "$unitPrice"] },
                                    0
                                ]
                            }
                        ]
                    }
                }
            },

            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalSoldAmount" },
                    totalSalesValue: { $sum: "$totalSoldValue" },
                    totalPurchases: { $sum: 1 },
                    totalPurchasesValue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },

                    // ✅ profit rounded to nearest whole number
                    totalProfit: {
                        $sum: {
                            $round: [
                                {
                                    $subtract: [
                                        "$totalSoldValue",
                                        { $multiply: ["$totalSoldAmount", "$unitPrice"] }
                                    ]
                                },
                                0
                            ]
                        }
                    },

                    quantity: { $sum: "$quantity" },
                    totalDamagedQuantity: { $sum: "$totalDamagedQuantity" },
                    totalDamagedValue: { $sum: "$totalDamagedValue" },
                    totalExpiredQuantity: { $sum: "$totalExpiredQuantity" },
                    totalExpiredValue: { $sum: "$totalExpiredValue" }
                }
            },

            {
                $project: {
                    _id: 0,
                    totalSales: 1,
                    totalSalesValue: 1,
                    totalPurchases: 1,
                    totalPurchasesValue: 1,
                    totalProfit: 1,
                    quantity: 1,
                    totalDamagedQuantity: 1,
                    totalDamagedValue: 1,
                    totalExpiredQuantity: 1,
                    totalExpiredValue: 1
                }
            }
        ];

        const noOrder = [
            {
                totalSales: 0,
                totalSalesValue: 0,
                totalPurchases: 0,
                totalPurchasesValue: 0,
                totalProfit: 0,
                quantity: 0,
                totalDamagedQuantity: 0,
                totalDamagedValue: 0,
                totalExpiredQuantity: 0,
                totalExpiredValue: 0
            }
        ];

        const result = await this.purchaseModel.aggregate(pipeline).exec();
        return result.length > 0 ? result : noOrder;
    }

    async findAll(query: QueryDto, req: any): Promise<{ purchases: Purchase[], totalDocuments: number }> {
        const {
            filter = '{}',
            sort = '{}',
            skip = 0,
            select = '',
            limit = 10
        } = query;
        try {
            const parsedFilter = JSON.parse(filter);
            const parsedSort = JSON.parse(sort);
            const keys = Object.keys(parsedFilter);

            if (!query.startDate || !query.endDate) {
                throw new BadRequestException('startDate and endDate are required');
            }

            const startDate = new Date(query.startDate);
            startDate.setHours(0, 0, 0, 0); // Start of the startDate

            const endDate = new Date(query.endDate);
            endDate.setHours(24, 59, 59, 999);
            keys.forEach(key => {
                if (key == 'createdAt') {
                    parsedFilter[key] = { $gte: startDate, $lte: endDate }
                } else if (key == 'expiryDate') {
                    parsedFilter[key] = { $gte: startDate, $lte: endDate };
                } else if (key == 'purchaseDate') {
                    parsedFilter[key] = { $gte: startDate, $lte: endDate };
                } else if (key == 'deliveryDate') {
                    parsedFilter[key] = { $gte: startDate, $lte: endDate };
                }
            });
            if (parsedFilter.supplier === '') {
                delete parsedFilter.supplier

                delete parsedFilter.status
            }

            if (parsedFilter.status === '') {
                delete parsedFilter.status
            }
            const purchases = await this.purchaseModel
                .find({ ...parsedFilter, location: req.user.location }) // Apply filtering
                .sort(parsedSort)   // Sorting
                .limit(Number(limit))
                .skip(Number(skip))
                .select(`${select}`)     // Projection of main document fields
                .populate({
                    path: 'supplier',
                    select: 'name',// Selecting only the 'name' field from the supplier
                    match: { _id: { $exists: true } }
                })
                .exec();
            const totalDocuments = await this.purchaseModel
                .countDocuments({ ...parsedFilter, location: req.user.location }); // Count total documents matching the filter

            return { purchases, totalDocuments };
        } catch (error) {
            errorLog(`getting all purchases error ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async findOne(id: string): Promise<Purchase | null> {
        try {
            return this.purchaseModel.findById(id).exec();
        } catch (error) {
            errorLog(`getting one purchases error ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async doDamagedGood(id: string, updatePurchaseDto: any, req: any) {

        try {
            const product = await this.productService.findOne(updatePurchaseDto.productId);
            const purchace = await this.purchaseModel.findById(id);
            const department = await this.departmentModel.findOne({ _id: updatePurchaseDto.from })
            if (!product || !purchace || !department) {
                throw new BadRequestException('Not found');
            }
            const departmentProduct = department.finishedGoods.findIndex((res) => {
                return res.productId.toString() == product._id
            })
            if (departmentProduct == -1) {
                throw new BadRequestException("Product Dosn't Exist in this Department");
            } else {
                if (department.finishedGoods[departmentProduct].quantity >= Number(updatePurchaseDto.quantity)) {
                    department.finishedGoods[departmentProduct].quantity = department.finishedGoods[departmentProduct].quantity - Number(updatePurchaseDto.quantity)
                } else {
                    throw new BadRequestException("Not Enough Product TO Be Returned");
                }
            }
            product.quantity = product.quantity - Number(updatePurchaseDto.quantity);
            product.lowStock = product.quantity <= product.roq;
            purchace.quantity = purchace.quantity - Number(updatePurchaseDto.quantity);


            delete updatePurchaseDto.productId;
            delete updatePurchaseDto._id;
            purchace.damagedGoods.push(updatePurchaseDto);
            const result = await Promise.all([
                product.save(),
                purchace.save(),
                department.save()
            ]);
            await this.stockFlowService.create('Damaged Goods', new Types.ObjectId(product._id as string), Number(updatePurchaseDto.quantity), department._id, null, 'out', new Date(Date.now()), req.user.username, req.user.location)
            return result;
        } catch (error) {
            errorLog(`Error create new Damaged ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async doReturns(id: string, updatePurchaseDto: any, req: any) {
        try {
            const product = await this.productService.findOne(updatePurchaseDto.productId);
            const purchace = await this.purchaseModel.findById(id);
            const department = await this.departmentModel.findOne({ _id: updatePurchaseDto.from })
            if (!product || !purchace || !department) {
                throw new BadRequestException('Not found');
            }

            const departmentProduct = department.finishedGoods.findIndex((res) => {
                return res.productId.toString() == product._id
            })

            if (departmentProduct == -1) {
                throw new BadRequestException("Product Dosn't Exist in this Department");
            } else {
                if (department.finishedGoods[departmentProduct].quantity >= Number(updatePurchaseDto.quantity)) {
                    department.finishedGoods[departmentProduct].quantity = department.finishedGoods[departmentProduct].quantity - Number(updatePurchaseDto.quantity)
                } else {
                    throw new BadRequestException("Not Enough Product TO Be Returned");
                }
            }
            product.quantity = product.quantity - Number(updatePurchaseDto.quantity);
            product.lowStock = product.quantity <= product.roq;
            purchace.quantity = purchace.quantity - Number(updatePurchaseDto.quantity);

            delete updatePurchaseDto.productId;
            delete updatePurchaseDto._id;
            purchace.returns.push(updatePurchaseDto);
            const result = await Promise.all([
                product.save(),
                purchace.save(),
                department.save()
            ]);
            await this.stockFlowService.create('Returns Outward', new Types.ObjectId(product._id as string), Number(updatePurchaseDto.quantity), department._id, null, 'out', new Date(Date.now()), req.user.username, req.user.location)
            return result;
        } catch (error) {
            errorLog(`Error create new returns ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async update(id: string, updatePurchaseDto: any, req: any) {
        try {
            const purchase = await this.purchaseModel.findById(id);
            if (!purchase) {
                throw new BadRequestException('Purchase Not Found');
            }

            for (const [key, value] of Object.entries(updatePurchaseDto)) {
                purchase[key] = value;

                if (key === 'status' && value === 'Delivered') {
                    const product = await this.productService.findOne(purchase.productId.toString());
                    if (!product) {
                        throw new Error('Product Not Found');
                    }

                    product.quantity = product.quantity + Number(purchase.quantity);
                    product.lowStock = product.quantity <= product.roq;
                    const mainDepartment = await this.departmentModel.findOne({ id: updatePurchaseDto.departmentId });

                    if (!mainDepartment) {
                        throw new Error('No Main Department in Facility, Please Create A Main Department And Try Again');
                    }

                    const departmentProduct = mainDepartment.finishedGoods.find((res) => res.productId === product._id);

                    if (departmentProduct) {
                        departmentProduct.quantity = departmentProduct.quantity + Number(purchase.quantity);
                    } else {
                        mainDepartment.finishedGoods.push({
                            title: product.title,
                            productId: new mongoose.Types.ObjectId(product._id as string),
                            quantity: Number(purchase.quantity),
                            cost: Number(purchase.totalPayable),
                            unitCost: Number(purchase.totalPayable) / Number(purchase.quantity)
                        });
                    }

                    await mainDepartment.save();
                    await product.save();
                    await this.stockFlowService.create('Purchases', new Types.ObjectId(product._id as string), Number(updatePurchaseDto.quantity), null, mainDepartment._id, 'in', new Date(Date.now()), req.user.username, req.user.location)

                }
                if (key === 'status' && value === 'Not Delivered') {
                    const product = await this.productService.findOne(purchase.productId.toString());
                    if (!product) {
                        throw new Error('Product Not Found');
                    }

                    product.quantity = product.quantity - Number(purchase.quantity);
                    product.lowStock = product.quantity <= product.roq;
                    const mainDepartment = await this.departmentModel.findById(updatePurchaseDto.departmentId);

                    if (!mainDepartment) {
                        throw new Error('No Main Department in Facility, Please Create A Main Department And Try Again');
                    }

                    const sendingProduct = mainDepartment.finishedGoods.find((res) => res.productId === product._id);

                    if (!sendingProduct) {
                        throw new Error('Product with id was not found. At this location');
                    }

                    sendingProduct.quantity = sendingProduct.quantity - Number(purchase.quantity);

                    await mainDepartment.save();
                    await product.save();
                }
            }
            return await purchase.save();
        } catch (error) {
            errorLog(`updating one purchases error ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async remove(id: string): Promise<Purchase | null> {
        try {
            return this.purchaseModel.findByIdAndDelete(id).exec();
        } catch (error) {
            errorLog(`removeing one purchases error ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }


    async editSoldQuantity(id: string, amount: number, price: number) {
        try {
            const purchase = await this.purchaseModel.findById(id)
            if (!purchase) {
                throw new BadRequestException('Purchase not found');
            }
            const productindex = purchase.sold.findIndex((item) => item.price == price)
            purchase.sold[productindex].amount -= amount
            if (purchase.sold[productindex].amount < 1) {
                purchase.sold.splice(productindex, 1)
            }
            await purchase.save();
            return purchase
        } catch (error) {
            errorLog(`removeing updating sold purchases error ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }


    async findFirstUnsoldPurchase(productId: string, req: any) {

        try {
            const purchase = await this.purchaseModel.findOne({
                productId: productId,
                $expr: { $lt: [{ $sum: "$sold.amount" }, "$quantity"] },
                location: req.user.location,
                status: 'Delivered'
            }).sort({ createdAt: 1 }).exec();

            return purchase;
        } catch (error) {
            errorLog(`${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getSuppliersPurchases(query: QueryDto, req: any) {
        const {
            filter = '{}',
            sort = '{}',
            skip = 0,
            select = '',
            limit = 10
        } = query;
        try {
            const parsedFilter = JSON.parse(filter);
            const parsedSort = JSON.parse(sort);
            const purchases = await this.purchaseModel
                .find({ ...parsedFilter, location: req.user.location }) // Apply filtering
                .sort(parsedSort)   // Sorting
                .limit(Number(limit))
                .skip(Number(skip))
                .select(`${select}`)
                .populate({
                    path: 'productId',
                    select: 'title',// Selecting only the 'name' field from the supplier
                    match: { _id: { $exists: true } }
                })
            return purchases
        } catch (error) {
            errorLog(error, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async pruchasesTotalsData(query: QueryDto, req: any) {
        try {
            const {
                filter = '{}',
                startDate,
                endDate
            } = query;
            const parsedFilter = JSON.parse(filter);
            if (!startDate || !endDate) {
                throw new BadRequestException('Start date and end date are required');
            }
            // Create date filter if provided
            let dateFilter = {};
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            dateFilter = {
                transactionDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            };


            const result = await this.purchaseModel.aggregate([
                {
                    $match: {
                        ...parsedFilter,
                        ...dateFilter,
                        location: req.user.location
                    }
                },
                {
                    // Stage 1: Calculate the total return cost for each document individually.
                    $addFields: {
                        returnCost: {
                            $multiply: [
                                { $sum: "$returns.quantity" }, // First, sum the quantities in the 'returns' array
                                "$price"                         // Then, multiply that sum by the document's 'cost'
                            ]
                        }
                    }
                },
                {
                    // Stage 1: Calculate the total return cost for each document individually.
                    $addFields: {
                        damagesCost: {
                            $multiply: [
                                { $sum: "$damagedGoods.quantity" }, // First, sum the quantities in the 'returns' array
                                "$price"                         // Then, multiply that sum by the document's 'cost'
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null, // Group all documents into a single result
                        totalNetPurchases: {
                            $sum: "$totalPayable" // Sum the 'totalAmount' from each document
                        },
                        totalPurchases: {
                            $sum: "$total" // Sum the 'totalAmount' from each document
                        },
                        totalDiscountReceived: {
                            $sum: "$discount" // Sum the 'totalAmount' from each document
                        },
                        totalDamages: {
                            // First, sum the 'total' within each document's 'returns' array,
                            // then sum those results together across all documents.
                            $sum: '$damagesCost'
                        },

                        totalReturnsOutward: {
                            $sum: "$returnCost" // Sum the 'returnCost' field calculated in the previous stage
                        }
                    }
                },
                {
                    $project: {
                        _id: 0 // Optional: Exclude the default _id field for a cleaner output
                    }
                }
            ])
            if (!result.length) {
                return [{
                    totalNetPurchases: 0,
                    totalPurchases: 0,
                    totalDiscountReceived: 0,
                    totalDamages: 0,
                    totalReturnsOutward: 0
                }];
            }
        
            return result[0];

        } catch (error) {
            errorLog(`Error calculating purchases totals: ${error}`, "ERROR");
            throw new InternalServerErrorException(error);
        }

    }
}
