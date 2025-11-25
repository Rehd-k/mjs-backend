import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PipelineStage } from 'mongoose';
import { Customer } from 'src/customer/customer.schema';
import { Expenses } from 'src/expense/expenses.schema';
import { errorLog } from 'src/helpers/do_loggers';
import { Invoice } from 'src/invoice/invoice.schema';
import { Product } from 'src/product/product.schema';
import { QueryDto } from 'src/product/query.dto';
import { Purchase } from 'src/purchases/purchases.schema';
import { RawMaterial } from 'src/raw-material/raw-material.entity';
import { Sale } from 'src/sales/sales.schema';
import { StockFlow } from 'src/stock-flow/stock-flow.entity';
import { StockSnapshot } from 'src/stock-snapshot/stock-snapshot.entity';

// // Interface for the report structure
// interface ProductReport {
//   Date: string;
//   Description: 'sale' | 'returns' | 'purchase' | 'invoice';
//   qty: number;
//   amount: number;
//   direction: 'outward' | 'inward';
// }

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(RawMaterial.name) private readonly rawMaterialModel: Model<RawMaterial>,
    @InjectModel(Expenses.name) private readonly expenseModel: Model<Expenses>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    @InjectModel(Purchase.name) private readonly purchaseModel: Model<Purchase>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(StockSnapshot.name) private readonly stockSnapshotModel: Model<StockSnapshot>,
    @InjectModel(StockFlow.name) private readonly stockFlowModel: Model<StockFlow>,

  ) { }

  async getSalesDashboard(req: any): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailySales = await this.saleModel.aggregate([
      { $match: { transactionDate: { $gte: today }, location: req.user.location } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
    ]);

    const weeklySales = await this.saleModel.aggregate([
      {
        $match: {
          transactionDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7))
          },
          location: req.user.location
        }
      },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
    ]);

    const monthlySales = await this.saleModel.aggregate([
      {
        $match: {
          transactionDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          },
          location: req.user.location
        }
      },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
    ]);

    return {
      dailySales: dailySales[0]?.totalSales || 0,
      weeklySales: weeklySales[0]?.totalSales || 0,
      monthlySales: monthlySales[0]?.totalSales || 0,
    };
  }

  async getRevenueReports(req: any): Promise<any> {
    const transactions = await this.saleModel.find({ location: req.user.location });
    let totalRevenue = 0;
    let totalCost = 0;

    for (const transaction of transactions) {
      totalRevenue += transaction.totalAmount;
      for (const item of transaction.products) {
        const product = await this.productModel.findById(item.productId);
        if (product) {
          totalCost = 0
        } else {
          totalCost += 0;
        }

      }
    }

    const profit = totalRevenue - totalCost;
    return { totalRevenue, totalCost, profit };
  }

  async getInventoryReports(req: any): Promise<any> {
    const products = await this.productModel.find({ location: req.user.location });
    const lowStock = products.filter((product) => product.quantity < product.roq);
    return {
      currentStock: products.map((product) => ({
        name: product.title,
        quantity: product.quantity,
      })),
      lowStock,
      stockTurnoverRates: products.map((product) => ({
        name: product.title,
        turnoverRate: (product.sold || 0) / (product.quantity + (product.sold || 0)),
      })),
    };
  }

  async getTopSellingProducts(req: any): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);



    const topSellingToday = await this.saleModel.aggregate([
      { $match: { transactionDate: { $gte: today }, location: req.user.location } },
      { $unwind: '$products' },
      { $group: { _id: { $toObjectId: '$products.productId' }, totalSold: { $sum: '$products.quantity' }, totalRevenue: { $sum: '$products.total' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productDetails' } },
      { $unwind: '$productDetails' },
      { $project: { _id: 0, title: '$productDetails.title', category: '$productDetails.category', totalSold: 1, totalRevenue: 1 } },
    ]);


    const topSellingWeekly = await this.saleModel.aggregate([
      { $match: { transactionDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }, location: req.user.location } },
      { $unwind: '$products' },
      { $group: { _id: { $toObjectId: '$products._id' }, totalSold: { $sum: '$products.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 0, title: '$product.title', totalSold: 1 } },
    ]);

    const topSellingMonthly = await this.saleModel.aggregate([
      { $match: { transactionDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }, location: req.user.location } },
      { $unwind: '$products' },
      { $group: { _id: { $toObjectId: '$products._id' }, totalSold: { $sum: '$products.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 0, title: '$product.title', totalSold: 1 } },
    ]);


    return {
      topSellingToday,
      topSellingWeekly,
      topSellingMonthly,
    };
  }

  async getProfitAndLoss(query: QueryDto, req: any) {
    if (!query.startDate || !query.endDate) {
      throw new Error("startDate and endDate are required");
    }
    const startDate = new Date(query.startDate);
    startDate.setHours(0, 0, 0, 0); // Start of the startDate

    const endDate = new Date(query.endDate);
    endDate.setHours(24, 59, 59, 999); // End of the endDate 

    // Calculate total revenue
    const revenueResult = await this.saleModel.aggregate([
      { $match: { transactionDate: { $gte: startDate, $lte: endDate }, location: req.user.location } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Calculate total expenses
    const expensesResult = await this.expenseModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, location: req.user.location, approved: true } },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
    ]);
    const totalExpenses = expensesResult[0]?.totalExpenses || 0;

    // Calculate profit or loss
    const profitOrLoss = totalRevenue - totalExpenses;
    return {
      totalRevenue,
      totalExpenses,
      profitOrLoss,
    };
  }

  async getProductStatistics(req: any): Promise<any> {
    const result = await this.productModel.aggregate([
      { $match: { isAvailable: true, location: req.user.location } },
      {
        $facet: {
          totalProducts: [{ $count: "count" }],
          totalQuantity: [{ $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }],
          totalValue: [{ $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$price"] } } } }],
          lowStockCount: [{ $match: { $expr: { $lt: ["$quantity", "$roq"] } } }, { $count: "count" }],
          fastestMovingProduct: [{ $sort: { sold: -1 } }, { $limit: 1 }, { $project: { _id: 1, title: 1 } }],
          slowestMovingProduct: [{ $sort: { sold: 1 } }, { $limit: 1 }, { $project: { _id: 1, title: 1 } }],
          expiredProducts: [{ $match: { expiryDate: { $lt: new Date() } } }, { $count: "count" }]
        }
      },
      {
        $project: {
          totalProducts: { $arrayElemAt: ["$totalProducts.count", 0] },
          totalQuantity: { $arrayElemAt: ["$totalQuantity.totalQuantity", 0] },
          totalValue: { $arrayElemAt: ["$totalValue.totalValue", 0] },
          lowStockCount: { $arrayElemAt: ["$lowStockCount.count", 0] },
          fastestMovingProduct: { $arrayElemAt: ["$fastestMovingProduct", 0] },
          slowestMovingProduct: { $arrayElemAt: ["$slowestMovingProduct", 0] },
          expiredProducts: { $arrayElemAt: ["$expiredProducts.count", 0] }
        }
      }
    ]);
    return result[0];
  }

  async getCustomerStatistics(req: any): Promise<any> {
    const result = await this.customerModel.aggregate([
      { $match: { location: req.user.location } },
      {
        $lookup: {
          from: "sales",
          localField: "orders",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      {
        $lookup: {
          from: "sales",
          localField: "returns",
          foreignField: "_id",
          as: "returnDetails",
        },
      },
      {
        $addFields: {
          lastPurchase: { $arrayElemAt: [{ $slice: ["$orderDetails", -1] }, 0] },
          orderCount: { $size: "$orders" },
        },
      },
      {
        $facet: {
          newestCustomers: [
            { $sort: { createdAt: -1 } },
            { $limit: 4 },
            {
              $project: {
                _id: 1,
                name: 1,
                lastPurchaseDate: "$lastPurchase.transactionDate",
                lastPurchaseAmount: "$lastPurchase.totalAmount",
                total_spent: 1,
              },
            },
          ],
          mostFrequentCustomer: [
            { $sort: { orderCount: -1 } },
            { $limit: 4 },
            {
              $project: {
                _id: 1,
                name: 1,
                lastPurchaseDate: "$lastPurchase.transactionDate",
                lastPurchaseAmount: "$lastPurchase.totalAmount",
                total_spent: 1,
              },
            },
          ],
          totalCustomers: [
            {
              $count: "totalCustomers",
            },
          ],
          retentionCurrentMonth: [
            {
              $match: {
                "lastPurchase.transactionDate": {
                  $gte: new Date(new Date().setDate(1)), // First day of the month
                  $lt: new Date(), // Today
                },
              },
            },
            {
              $count: "customerRetention",
            },
          ],
        },
      },
    ]);
    return result[0];
  }


  async getWeeklySalesData(req: any): Promise<any> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Set to Saturday
    endOfWeek.setHours(24, 59, 59, 999);

    const weeklySales = await this.saleModel.aggregate([
      {
        $match: {
          transactionDate: { $gte: startOfWeek, $lte: endOfWeek },
          location: req.user.location,
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" }
          },
          totalSales: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } } // Sort by date
    ]);

    const weeklyExpenses = await this.expenseModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
          location: req.user.location,
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalExpenses: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } } // Sort by date
    ]);



    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const expensesMap = new Map(weeklyExpenses.map(exp => [exp._id, exp.totalExpenses]));



    const allDays = new Set([...weeklySales.map(day => day._id), ...weeklyExpenses.map(exp => exp._id)]);

    const combinedData = Array.from(allDays).map(date => {
      const salesData = weeklySales.find(day => day._id === date) || { totalSales: 0 };
      const expensesData = weeklyExpenses.find(exp => exp._id === date) || { totalExpenses: 0 };
      const dayName = daysOfWeek[new Date(date).getDay()];

      return {
        date,
        totalSales: salesData.totalSales,
        expenses: expensesData.totalExpenses,
        day: dayName,
      };
    });

    return combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }


  async getSalesData(option: string, req: any): Promise<any> {
    try {
      const now = new Date();
      let startDate, endDate, groupBy;

      switch (option) {
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

      const sales = await this.saleModel.aggregate([
        { $match: { transactionDate: { $gte: startDate, $lte: endDate }, location: req.user.location } },
        { $group: { _id: groupBy, totalSales: { $sum: "$totalAmount" } } },
        { $sort: { "_id": 1 } },
        { $project: { _id: 0, for: "$_id.for", totalSales: 1 } }
      ]);

      return sales;
    } catch (error) {
      errorLog(`Error Getting Sales Chart Data ${error}`, "ERROR")
      throw new InternalServerErrorException(error.message);
    }

  };


  /**
   * Generates product stock & movement report between two dates.
   *
   * - start: start date (will be normalized to start of day)
   * - end: end date (will be normalized to end of day)
   * - req: optional, used to filter by location if present (req.user.location)
   *
   * @returns -  Returns an array with entries:
   * { productId, title, sellingPriceUnit, purchasingPriceUnit, openingStock, newStock, totalStock, qtySold, closingStock, amount }
   */
  async getStockAndSalesReport(
    query: any,
    req: any
  ): Promise<any[]> {
    const { startDate, endDate, department, departmentId } = query;
    const location = req.user.location;

    // --- 1. Date Setup ---
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0); // Force start of day

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Force end of day

    // Target date for the closing snapshot (The morning after the end date)
    const closingSnapshotDate = new Date(end);
    closingSnapshotDate.setDate(closingSnapshotDate.getDate() + 1);
    closingSnapshotDate.setUTCHours(0, 0, 0, 0);

    console.log(start, closingSnapshotDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // --- 2. Optimized Snapshot Pipeline ---
    const snapshotPipeline = [
      {
        $match: {
          date: { $in: [start, closingSnapshotDate] },
          ...(department ? { department } : {}),
          ...(location ? { location } : {}),
        },
      },
      // PERFORMANCE FIX: Combine arrays first.
      // Original code unwound twice, creating (N * M) documents. 
      // This keeps it to (N + M) documents.
      {
        $project: {
          snapshotDate: '$date',
          allItems: {
            $concatArrays: [
              { $ifNull: ['$finishedGoods', []] },
              { $ifNull: ['$RawGoods', []] },
            ],
          },
        },
      },
      { $unwind: '$allItems' },
      {
        $group: {
          _id: '$allItems.productId',
          purchasingPriceUnit: { $avg: '$allItems.unitCost' }, // Take avg cost if multiple
          openingStock: {
            $sum: {
              $cond: [{ $eq: ['$snapshotDate', start] }, '$allItems.quantity', 0],
            },
          },
          closingStock: {
            $sum: {
              $cond: [
                { $eq: ['$snapshotDate', closingSnapshotDate] },
                '$allItems.quantity',
                0,
              ],
            },
          },
          // We explicitly track if a closing snapshot actually existed for this product
          hasClosingSnapshot: {
            $max: { $cond: [{ $eq: ['$snapshotDate', closingSnapshotDate] }, true, false] }
          }
        },
      },
    ];

    const stockSnapshots = await this.stockSnapshotModel
      .aggregate(snapshotPipeline)
      .exec();

    // --- 3. Get Movements (StockFlows) ---
    const flowPipeline = [
      {
        $match: {
          transactionDate: { $gte: start, $lte: end },
          title: { $in: ['Purchases', 'Sells', 'Returns Inward', 'Returns Outward'] },
          ...(location ? { location } : {}),
          ...(departmentId
            ? {
              $or: [
                {
                  title: { $in: ['Purchases', 'Returns Inward'] },
                  stockTo: departmentId,
                },
                {
                  title: { $in: ['Sells', 'Returns Outward'] },
                  stockFrom: departmentId,
                },
              ],
            }
            : {}),
        },
      },
      {
        $group: {
          _id: '$product',
          // Quantity bought or returned by customer to us
          purchasedQty: {
            $sum: {
              $cond: [{ $in: ['$title', ['Purchases', 'Returns Inward']] }, '$quantity', 0],
            },
          },
          // Quantity we returned to supplier
          returnedOutQty: {
            $sum: {
              $cond: [{ $eq: ['$title', 'Returns Outward'] }, '$quantity', 0],
            },
          },
          // Quantity sold
          quantitySold: {
            $sum: {
              $cond: [{ $eq: ['$title', 'Sells'] }, '$quantity', 0],
            },
          },
          // Sales Money: Sells (Positive) - Returns Inward (Negative/Refunds)
          salesAmount: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$title", "Sells"] }, then: { $ifNull: ["$amount", 0] } },
                  // BUSINESS LOGIC FIX: Returns reduce sales revenue
                  { case: { $eq: ["$title", "Returns Inward"] }, then: { $multiply: [{ $ifNull: ["$amount", 0] }, -1] } }
                ],
                default: 0
              }
            },
          },
        },
      },
    ];

    const movements = await this.stockFlowModel.aggregate(flowPipeline).exec();

    // --- 4. Merge Logic (Using Map) ---
    const reportMap = new Map<string, any>();

    // Initialize with snapshot data
    stockSnapshots.forEach((item) => {
      reportMap.set(item._id.toString(), {
        productId: item._id,
        openingStock: item.openingStock || 0,
        closingStock: item.closingStock || 0,
        hasClosingSnapshot: item.hasClosingSnapshot, // Flag for fallback logic
        purchasingPriceUnit: item.purchasingPriceUnit || 0,
        // Defaults
        purchasedQty: 0,
        returnedOutQty: 0,
        quantitySold: 0,
        salesAmount: 0,
      });
    });

    // Merge movements
    movements.forEach((item) => {
      const key = item._id.toString();
      const existing = reportMap.get(key) || {
        productId: item._id,
        openingStock: 0,
        closingStock: 0,
        hasClosingSnapshot: false,
        purchasingPriceUnit: 0,
      };

      reportMap.set(key, {
        ...existing,
        purchasedQty: (existing.purchasedQty || 0) + (item.purchasedQty || 0),
        returnedOutQty: (existing.returnedOutQty || 0) + (item.returnedOutQty || 0),
        quantitySold: (existing.quantitySold || 0) + (item.quantitySold || 0),
        salesAmount: (existing.salesAmount || 0) + (item.salesAmount || 0),
      });
    });

    // --- 5. Calculation & Enrichment ---
    let report = Array.from(reportMap.values()).map((item: any) => {
      // Mathematical Logic
      // New Stock added to shelf = (Bought + Customer Returns) - (Returns to Supplier)
      const newStock = item.purchasedQty - item.returnedOutQty;

      const totalAvailable = item.openingStock + newStock;

      // COST CALCULATION
      const costOfGoodsSold = item.quantitySold * item.purchasingPriceUnit;
      const grossProfit = item.salesAmount - costOfGoodsSold;

      // CLOSING STOCK FALLBACK
      // If we don't have a snapshot (e.g., report is for "Today"), calculate theoretical stock
      let finalClosingStock = item.closingStock;
      if (!item.hasClosingSnapshot) {
        finalClosingStock = totalAvailable - item.quantitySold;
        // Prevent negative stock in reporting if data is messy
        if (finalClosingStock < 0) finalClosingStock = 0;
      }

      return {
        ...item,
        newStock,
        totalAvailable,
        grossProfit,
        costOfGoodsSold,
        closingStock: finalClosingStock,
      };
    });

    // --- 6. Fetch Product Details ---
    const productIds = report.map((r) => r.productId);

    // Use Promise.all to run DB queries in parallel
    const [products, rawmaterials] = await Promise.all([
      this.productModel.find({ _id: { $in: productIds } }).select('title category price').lean(),
      this.rawMaterialModel.find({ _id: { $in: productIds } }).select('title category').lean(),
    ]);

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const rawMap = new Map(rawmaterials.map((r) => [r._id.toString(), r]));

    // Format Final Output
    report = report.map((item: any) => {
      const prod = productMap.get(item.productId.toString());
      const raw = rawMap.get(item.productId.toString());

      return {
        productId: item.productId,
        title: prod?.title || raw?.title || 'Unknown Product',
        category: prod?.category || raw?.category || 'Uncategorized',

        // BUG FIX: Used prod.sellingPrice instead of prod.price
        sellingPriceUnit: prod?.price || 0,

        purchasingPriceUnit: Number(item.purchasingPriceUnit.toFixed(2)),
        openingStock: item.openingStock,
        newStock: item.newStock,
        totalAvailable: item.totalAvailable,
        quantitySold: item.quantitySold,
        closingStock: item.closingStock,
        salesAmount: item.salesAmount,
        grossProfit: Number(item.grossProfit.toFixed(2)),
      };
    });

    // Sort alphabetically
    report.sort((a, b) => a.title.localeCompare(b.title));
    console.log(report);
    return report;
  }

  /**
    * Generates a daily sales, returns, purchases, and invoice report for a specific product within a date range.
    * @param productId - The ID of the product to generate the report for.
    * @param startDate - The start of the date range.
    * @param endDate - The end of the date range.
    * @returns A promise that resolves to an array of daily report objects.
    */
  async getProductDailyReport(
    productId: string,
    start: Date,
    end: Date
  ) {

    // : Promise<ProductReport[]>
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0); // Start of day

    const endDate = new Date(end);
    endDate.setHours(24, 59, 59, 999); // End of day


    const [sales, returns, purchases, invoices] = await Promise.all([
      this.getSalesReport(productId, startDate, endDate),
      this.getReturnsReport(productId, startDate, endDate),
      this.getPurchaseReport(productId, startDate, endDate),
      this.getInvoiceReport(productId, startDate, endDate),
    ]);

    // --- COMBINE AND SORT ---
    const combinedReport = [...sales, ...returns, ...purchases, ...invoices];

    // Sort the final report by date
    combinedReport.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());


    return combinedReport;
  }

  /**
   * Fetches and aggregates sales data for a product.
   */
  private async getSalesReport(productId: string, startDate: Date, endDate: Date) {


    const result = await this.saleModel.aggregate([
      {
        $match: {
          transactionDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          // 'products._id': objectIdProductId,
        },
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': productId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
          quantity: { $sum: '$products.quantity' },
          total: { $sum: '$products.total' },
        },
      },
      {
        $project: {
          _id: 0,
          Date: '$_id',
          Description: 'sale',
          qty: '$quantity',
          amount: '$total',
          direction: 'outward',
        },
      },
    ]);

    return result;
  }
  // : Promise<ProductReport[]>

  /**
   * Fetches and aggregates returns data for a product.
   */
  private async getReturnsReport(productId: string, startDate: Date, endDate: Date) {
    return this.saleModel.aggregate([
      {
        $match: {
          'returns.productId': productId,
          'returns.returnedAt': { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      { $unwind: '$returns' },
      {
        $match: {
          'returns.productId': productId,
          'returns.returnedAt': { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$returns.returnedAt' } },
          quantity: { $sum: '$returns.quantity' },
          total: { $sum: '$returns.total' }
        }
      },
      {
        $project: {
          _id: 0,
          Date: '$_id',
          Description: 'returns',
          qty: '$quantity',
          amount: '$total',
          direction: 'inward'
        }
      }
    ]);
  }
  // : Promise<ProductReport[]>
  /**
   * Fetches and aggregates purchase data for a product.
   */
  private async getPurchaseReport(productId: string, startDate: Date, endDate: Date) {

    return this.purchaseModel.aggregate([
      {
        $match: {
          productId,
          purchaseDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } },
          quantity: { $sum: '$quantity' },
          total: { $sum: '$total' },
        }
      },
      {
        $project: {
          _id: 0,
          Date: '$_id',
          Description: 'purchase',
          qty: '$quantity',
          amount: '$total',
          direction: 'inward',
        }
      }
    ]);
  }
  // : Promise<ProductReport[]> 
  /**
  * Fetches and aggregates invoice data for a product.
  */
  private async getInvoiceReport(productId: string, startDate: Date, endDate: Date) {
    const objectIdProductId = new Types.ObjectId(productId);
    return this.invoiceModel.aggregate([
      {
        $match: {
          'items.productId': objectIdProductId,
          issuedDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }
      },
      { $unwind: '$items' },
      { $match: { 'items.productId': objectIdProductId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$issuedDate' } },
          quantity: { $sum: '$items.quantity' },
          total: { $sum: '$items.total' },
        }
      },
      {
        $project: {
          _id: 0,
          Date: '$_id',
          Description: 'invoice',
          qty: '$quantity',
          amount: '$total',
          direction: 'outward',
        }
      }
    ]);
  }

}
