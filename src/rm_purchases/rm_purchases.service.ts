import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRmPurchaseDto } from './dto/create-rm_purchase.dto';
import { UpdateRmPurchaseDto } from './dto/update-rm_purchase.dto';
import { RmPurchase } from './rm_purchase.entity';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SupplierService } from 'src/supplier/supplier.service';
import { Department } from 'src/department/entities/department.entity';
import { CashflowService } from 'src/cashflow/cashflow.service';
import { RawMaterial } from 'src/raw-material/raw-material.entity';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from 'src/helpers/query.dto';
import { RawMaterialService } from 'src/raw-material/raw-material.service';

@Injectable()
export class RmPurchasesService {
  constructor(
    @InjectModel(RmPurchase.name) private RmPurchaseModel: Model<RmPurchase>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    @InjectModel(RawMaterial.name) private rawMaterialModel: Model<RawMaterial>,

    private supplierService: SupplierService,
    private cashflowService: CashflowService,
    private rawMaterialService: RawMaterialService
  ) { }


  async create(CreateRmPurchaseDto: any, req: any): Promise<RmPurchase> {
    try {
      CreateRmPurchaseDto.location = req.user.location;
      CreateRmPurchaseDto.initiator = req.user.username;
      const createdRmPurchase = new this.RmPurchaseModel(CreateRmPurchaseDto);
      console.log(CreateRmPurchaseDto)
      const rmProduct = await this.rawMaterialModel.findOne({ _id: createdRmPurchase.rawmaterialId.toString() });
      if (!rmProduct)
        throw new BadRequestException('Raw Material Not Found')
      rmProduct.quantity = rmProduct.quantity + Number(createdRmPurchase.quantity);

      if (CreateRmPurchaseDto.status === 'Delivered') {
        const mainDepartment = await this.departmentModel.findOne({ _id: createdRmPurchase.dropOfLocation })
        if (!mainDepartment) {
          throw new Error('This Drop Of Point Does not Exist  in Facility, Please Create A Drop Of Point And Try Again')
        }
        const departmentProduct = mainDepartment.finishedGoods.findIndex((res) => {
          return res.productId.toString() == rmProduct._id.toString();
        })


        if (departmentProduct == -1) {
          mainDepartment.RawGoods.push(
            {
              title: rmProduct.title,
              productId: new mongoose.Types.ObjectId(rmProduct._id),
              quantity: Number(createdRmPurchase.quantity),
              cost: Number(createdRmPurchase.totalPayable),
              unit: rmProduct.unit,
            }
          )
        } else {
          mainDepartment.RawGoods[departmentProduct].quantity = mainDepartment.finishedGoods[departmentProduct].quantity + Number(createdRmPurchase.quantity)
        }

        await Promise.all([mainDepartment.save(), rmProduct.save()]);
      }
      const order = await createdRmPurchase.save();
      await this.supplierService.addOrder(createdRmPurchase.supplier, order._id);
      if (createdRmPurchase.debt < createdRmPurchase.totalPayable) {
        const paymentInfo = {
          title: `Purchase Payment For ${rmProduct?.title}`,
          paymentFor: createdRmPurchase._id,
          cash: createdRmPurchase.cash,
          bank: createdRmPurchase.bank,
          type: 'out',
          moneyFrom: createdRmPurchase.moneyFrom,
          transactionDate: createdRmPurchase.purchaseDate,
          initiator: req.user.username,
          location: req.user.location
        }
        await this.cashflowService.createPayment(paymentInfo);
      }
      return order
    } catch (error) {
      errorLog(`Failed to create purchase ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }


  async getDashboardData(id: string) {
    const pipeline = [
      { $match: { rawmaterialId: id } },

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
          totalSoldAmount: { $sum: "$used.amount" },
          totalSoldValue: {
            $sum: {
              $map: {
                input: "$used",
                as: "u",
                in: { $multiply: ["$$u.amount", "$$u.cost"] }
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

    const result = await this.RmPurchaseModel.aggregate(pipeline).exec();
    return result.length > 0 ? result[0] : noOrder[0];
  }

  async findAll(query: QueryDto, req: any): Promise<{ purchases: RmPurchase[], totalDocuments: number }> {
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
      const purchases = await this.RmPurchaseModel
        .find({ ...parsedFilter, location: req.user.location }) // Apply filtering
        .sort(parsedSort)   // Sorting
        .limit(Number(limit))
        .skip(Number(skip))
        .select(`${select}`)     // Projection of main document fields
        .populate({
          path: 'supplier',
          select: 'name' // Selecting only the 'name' field from the supplier
        })
        .exec();
      const totalDocuments = await this.RmPurchaseModel
        .countDocuments({ ...parsedFilter, location: req.user.location }); // Count total documents matching the filter

      return { purchases, totalDocuments };
    } catch (error) {
      errorLog(`getting all purchases error ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }



  async findOne(id: string): Promise<RmPurchase | null> {
    try {
      return this.RmPurchaseModel.findById(id).exec();
    } catch (error) {
      errorLog(`getting one purchases error ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async doDamagedGood(id: string, updateRmPurchaseDto: any) {
    const rmProduct = await this.rawMaterialService.findOne(updateRmPurchaseDto.productId);
    const purchace = await this.RmPurchaseModel.findById(id);
    if (!rmProduct || !purchace) {
      throw new BadRequestException('Not found');
    }
    rmProduct.quantity = rmProduct.quantity - Number(updateRmPurchaseDto.quantity);

    purchace.quantity = purchace.quantity - Number(updateRmPurchaseDto.quantity);

    delete updateRmPurchaseDto.productId;
    delete updateRmPurchaseDto._id;
    purchace.damagedGoods.push(updateRmPurchaseDto);
    const result = await Promise.all([
      rmProduct.save(),
      purchace.save()
    ]);
    return result;
  }

  async doReturns(id: string, updatePurchaseDto: any) {
    const rmProduct = await this.rawMaterialService.findOne(updatePurchaseDto.productId);
    const purchace = await this.rawMaterialModel.findById(id);
    if (!rmProduct || !purchace) {
      throw new BadRequestException('Not found');
    }

    rmProduct.quantity = rmProduct.quantity - Number(updatePurchaseDto.quantity);
    purchace.quantity = purchace.quantity - Number(updatePurchaseDto.quantity);

    delete updatePurchaseDto.productId;
    delete updatePurchaseDto._id;
    purchace.returns.push(updatePurchaseDto);
    const result = await Promise.all([
      rmProduct.save(),
      purchace.save()
    ]);
    return result;
  }


  async update(id: string, updateRmPurchaseDto: any) {
    try {
      const rmPurchase = await this.RmPurchaseModel.findById(id);
      if (!rmPurchase) {
        throw new BadRequestException('Rm Purchase Not Found');
      }

      // ✅ Apply incoming updates
      Object.assign(rmPurchase, updateRmPurchaseDto);

      // ✅ Handle status change
      if (updateRmPurchaseDto.status) {
        if (updateRmPurchaseDto.status === 'Delivered') {
          await this.handleDelivered(rmPurchase, updateRmPurchaseDto.departmentId);
        } else if (updateRmPurchaseDto.status === 'Not Delivered') {
          await this.handleNotDelivered(rmPurchase, updateRmPurchaseDto.departmentId);
        }
      }

      return await rmPurchase.save();
    } catch (error) {
      errorLog(`Updating Rm Purchase failed: ${error}`, 'ERROR');
      throw new BadRequestException(error.message || 'Update failed');
    }
  }

  /**
   * Handle delivered status
   */
  private async handleDelivered(rmPurchase, departmentId: string) {
    const rmProduct = await this.rawMaterialModel.findById(rmPurchase.productId);
    if (!rmProduct) throw new BadRequestException('Raw material product not found');

    // Increase stock
    rmProduct.quantity += Number(rmPurchase.quantity);

    const mainDepartment = await this.departmentModel.findById(departmentId);
    if (!mainDepartment) {
      throw new BadRequestException('No Such Department found. Please create one and try again.');
    }

    // Update department goods
    const existing = mainDepartment.RawGoods.findIndex(
      (item) => item.productId.toString() === rmProduct._id.toString()
    );

    if (existing !== -1) {
      mainDepartment.RawGoods[existing].quantity += Number(rmPurchase.quantity);
    } else {
      mainDepartment.RawGoods.push({
        title: rmProduct.title,
        productId: rmProduct._id,
        quantity: Number(rmPurchase.quantity),
        cost: rmPurchase.totalPayable,
        unit: rmProduct.unit,
      });
    }

    await Promise.all([rmProduct.save(), mainDepartment.save()]);
  }

  /**
   * Handle not-delivered status (reverse the stock update)
   */
  private async handleNotDelivered(rmPurchase, departmentId: string) {
    const rmProduct = await this.rawMaterialModel.findById(rmPurchase.productId);
    if (!rmProduct) throw new BadRequestException('Raw material product not found');

    // Decrease stock
    rmProduct.quantity -= Number(rmPurchase.quantity);

    const mainDepartment = await this.departmentModel.findById(departmentId);
    if (!mainDepartment) {
      throw new BadRequestException('No Main Department found. Please create one and try again.');
    }

    const productInDept = mainDepartment.RawGoods.find(
      (item) => item.productId.toString() === rmProduct._id.toString()
    );

    if (!productInDept) {
      throw new BadRequestException('Product not found in department');
    }

    productInDept.quantity -= Number(rmPurchase.quantity);

    await Promise.all([rmProduct.save(), mainDepartment.save()]);
  }

  async remove(id: string): Promise<RmPurchase | null> {
    try {
      return this.RmPurchaseModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`removeing one purchases error ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async editSoldQuantity(id: string, amount: number, price: number) {
    try {
      const purchase = await this.RmPurchaseModel.findById(id)
      if (!purchase) {
        throw new BadRequestException('Purchase not found');
      }
      const productindex = purchase.used.findIndex((item) => item.cost == price)
      purchase.used[productindex].amount -= amount
      if (purchase.used[productindex].amount < 1) {
        purchase.used.splice(productindex, 1)
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
      const purchase = await this.RmPurchaseModel.findOne({
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
}
