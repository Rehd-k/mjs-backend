import { BadRequestException, Body, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DepartmentHistory } from "./entities/department.history.entity";
import { Model } from "mongoose";
import { errorLog } from "src/helpers/do_loggers";
import { QueryDto } from "src/product/query.dto";
import { DepartmentService } from "./department.service";


@Injectable()
export class DepartmentHistoryService {
  constructor(
    @InjectModel(DepartmentHistory.name) private storeHistoryModel: Model<DepartmentHistory>,
    private readonly storeService: DepartmentService) { }

  async createHistory(newHistory: any, req: any) {
    try {
      const history = new this.storeHistoryModel(newHistory)
      history.initiator = req.user.username
      history.location = req.user.location
      return await history.save();
    } catch (error) {
      errorLog(`Error creating this history: ${error}`, "ERROR")
      throw new Error(`Error creating one store history: ${error.message}`);
    }
  }

  async handleAprove(id: string, req: any, section) {

    try {
      let products: any = [];
      const history = await this.storeHistoryModel.findById(id).populate({
        path: `products.product`, // 👈e e
        model: `${section == 'RawGoods' ? 'RawMaterial' : 'Product'}`,
        select: 'title price cost unitCost',
      });
      if (history) {
        for (const element of history!.products) {
          let item = {
            productId: element.product,
            toSend: element.quantity
          }
          products.push(item as any)
        } 
        history.closer = req.user.username
        this.storeService.sendOrReceiveStock(
          history.fromId.toString(),
          history.toId.toString(),
          history.section,
          products,
          req,
          false
        )
        await history.save()
      }
      return history
    } catch (error) {
      errorLog(`Error Approveing this Request ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findAll(req: any, query: QueryDto) {
    try {
      const {
        filter = '{}',
        sort = '{}',
        skip = 0,
        select = '',
        limit = 10,
        startDate,
        endDate,
      } = query;

      if (!startDate || !endDate) {
        throw new BadRequestException('startDate and endDate are required');
      }

      let parsedFilter: Record<string, any> = {};
      let parsedSort: Record<string, any> = {};

      try {
        parsedFilter = JSON.parse(filter);
        parsedSort = JSON.parse(sort);
      } catch {
        throw new BadRequestException('Invalid filter or sort JSON');
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);


      // ✅ Build your base mongoFilter
      const mongoFilter: any = {
        ...parsedFilter,
        createdAt: { $gte: start, $lte: end },
        location: req.user.location,
      };

      // ✅ Handle department filter (in from or to)
      if (parsedFilter.department) {
        const dept = parsedFilter.department.toLowerCase();
        delete mongoFilter.department; // remove from direct match
        mongoFilter.$or = [{ from: dept }, { to: dept }];
      }

      // ✅ Handle confirmation filter
      if (parsedFilter.confirmed !== undefined) {
        const confirmedValue = String(parsedFilter.confirmed).toLowerCase();

        if (confirmedValue === 'true' || confirmedValue === '1') {
          mongoFilter.closer = { $exists: true, $ne: null }; // only confirmed
        } else if (confirmedValue === 'false' || confirmedValue === '0') {
          mongoFilter.$or = mongoFilter.$or || [];
          mongoFilter.$or.push({ closer: { $exists: false } }, { closer: null }); // only unconfirmed
        } else if (confirmedValue === 'all') {
          // ✅ do nothing → get all (confirmed + unconfirmed)
        }

        delete mongoFilter.confirmed;
      }


      const projection = select
        ? select.split(' ').reduce((acc, field) => {
          acc[field] = 1;
          return acc;
        }, {} as Record<string, 1>)
        : {};
 

      // ✅ Aggregation pipeline
      const pipeline: any[] = [
        { $match: mongoFilter },
        {
          $facet: {
            data: [
              { $sort: parsedSort },
              { $skip: Number(skip) },
              { $limit: Number(limit) },

              // 👇 Lookup finished goods
              {
                $lookup: {
                  from: 'products',
                  let: { products: '$products' },
                  pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$products.product'] } } },
                    { $project: { title: 1 } },
                  ],
                  as: 'productsLookup',
                },
              },

              // 👇 Lookup raw materials
              {
                $lookup: {
                  from: 'rawmaterials',
                  let: { products: '$products' },
                  pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$products.product'] } } },
                    { $project: { title: 1 } },
                  ],
                  as: 'rawMaterialsLookup',
                },
              },

              // 👇 Conditionally pick correct list
              {
                $addFields: {
                  populatedProducts: {
                    $cond: [
                      { $eq: ['$section', 'finishedGoods'] },
                      '$productsLookup',
                      '$rawMaterialsLookup',
                    ],
                  },
                },
              },

              // 👇 Map products with their names
              {
                $addFields: {
                  products: {
                    $map: {
                      input: '$products',
                      as: 'prod',
                      in: {
                        quantity: '$$prod.quantity',
                        product: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$populatedProducts',
                                cond: { $eq: ['$$this._id', '$$prod.product'] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                },
              },

              // 👇 Cleanup
              {
                $project: {
                  populatedProducts: 0,
                  productsLookup: 0,
                  rawMaterialsLookup: 0,
                  ...(Object.keys(projection).length ? projection : {}),
                },
              },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
        {
          $project: {
            history: '$data',
            totalDocuments: { $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0] },
          },
        },
      ];

      const result = await this.storeHistoryModel.aggregate(pipeline).exec();
      return result[0] || { history: [], totalDocuments: 0 };


    } catch (error) {
      errorLog(`Error getting all store: ${error}`, "ERROR")
      throw new BadRequestException(`Error getting all store: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<DepartmentHistory | null> {
    try {
      return await this.storeHistoryModel.findById(id).exec();
    } catch (error) {
      errorLog(`Error finding one ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async update(id: string, updateDepartmentHistoryDto: any) {
    try {
      const history = await this.storeHistoryModel.findByIdAndUpdate(id, { $set: updateDepartmentHistoryDto }, { new: true })
      return history;
    } catch (error) {
      errorLog(`Error updating one : ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      return this.storeHistoryModel.findByIdAndDelete(id)
    } catch (error) {
      errorLog(`Error remove one : ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  /**
 * ✅ Combined query: check for "from"/"to" and confirmed/unconfirmed
 * You can pass filters from the frontend like:
 * { department: 'warehouse', confirmed: true }
 */
  async findHistoriesByFilter(filter: { department?: string; confirmed?: boolean }) {
    const query: any = {};

    // Filter by confirmation status
    if (filter.confirmed === true) {
      query.closer = { $exists: true, $ne: null };
    } else if (filter.confirmed === false) {
      query.$or = [{ closer: { $exists: false } }, { closer: null }];
    }

    // Filter by department (in either from or to)
    if (filter.department) {
      const name = filter.department.toLowerCase();
      query.$or = query.$or || [];
      query.$or.push({ from: name }, { to: name });
    }

    return this.storeHistoryModel
      .find(query)
      .populate('products.product')
      .lean();
  }


  /**
   * ✅ Get all department histories that have a closer (confirmed)
   */
  async findConfirmedHistories() {
    return this.storeHistoryModel
      .find({ closer: { $exists: true, $ne: null } })
      .populate('products.product')
      .lean();
  }

  /**
   * ✅ Get all department histories that do NOT have a closer (unconfirmed)
   */
  async findUnconfirmedHistories() {
    return this.storeHistoryModel
      .find({ $or: [{ closer: { $exists: false } }, { closer: null }] })
      .populate('products.product')
      .lean();
  }

  /**
   * ✅ Find all histories where a department (by name) appears in either "from" or "to"
   */
  async findByDepartmentName(departmentName: string) {
    const name = departmentName.toLowerCase();
    return this.storeHistoryModel
      .find({ $or: [{ from: name }, { to: name }] })
      .populate('products.product')
      .lean();
  }



}