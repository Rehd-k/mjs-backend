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
        path: `products.product`, // 👈 nested path populate
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

      // ✅ Ensure dates are provided
      if (!startDate || !endDate) {
        throw new BadRequestException('startDate and endDate are required');
      }

      // ✅ Parse query params safely
      let parsedFilter: Record<string, any> = {};
      let parsedSort: Record<string, any> = {};

      try {
        parsedFilter = JSON.parse(filter);
        parsedSort = JSON.parse(sort);
      } catch {
        throw new BadRequestException('Invalid filter or sort JSON');
      }

      // ✅ Date range normalization
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // ✅ Merge all filters
      const mongoFilter = {
        ...parsedFilter,
        // createdAt: { $gte: start, $lte: end },
        location: req.user.location,
      };
      const projection = select
        ? select.split(' ').reduce((acc, field) => {
          acc[field] = 1;
          return acc;
        }, {})
        : {};

      const pipeline: any[] = [
        { $match: mongoFilter },
        {
          $facet: {
            data: [
              { $sort: parsedSort },
              { $skip: Number(skip) },
              { $limit: Number(limit) },

              // 👇 First lookup into products
              {
                $lookup: {
                  from: "products",
                  let: { products: "$products" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $in: ["$_id", "$$products.product"] }
                      }
                    },
                    { $project: { title: 1 } }
                  ],
                  as: "productsLookup"
                }
              },

              // 👇 Second lookup into rawmaterials
              {
                $lookup: {
                  from: "rawmaterials",
                  let: { products: "$products" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $in: ["$_id", "$$products.product"] }
                      }
                    },
                    { $project: { title: 1 } }
                  ],
                  as: "rawMaterialsLookup"
                }
              },

              // 👇 Pick the correct populated array based on section
              {
                $addFields: {
                  populatedProducts: {
                    $cond: [
                      { $eq: ["$section", "finishedGoods"] },
                      "$productsLookup",
                      "$rawMaterialsLookup"
                    ]
                  }
                }
              },

              // 👇 Map products array with matched titles
              {
                $addFields: {
                  products: {
                    $map: {
                      input: "$products",
                      as: "prod",
                      in: {
                        quantity: "$$prod.quantity",
                        product: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$populatedProducts",
                                cond: { $eq: ["$$this._id", "$$prod.product"] }
                              }
                            },
                            0
                          ]
                        }
                      }
                    }
                  }
                }
              },

              // 👇 Remove temporary fields
              {
                $project: {
                  populatedProducts: 0,
                  productsLookup: 0,
                  rawMaterialsLookup: 0,
                  ...(Object.keys(projection).length ? projection : {})
                }
              }
            ],
            totalCount: [{ $count: "count" }]
          }
        },
        {
          $project: {
            history: "$data",
            totalDocuments: {
              $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0]
            }
          }
        }

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
}