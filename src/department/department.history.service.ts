import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DepartmentHistory } from "./entities/department.history.entity";
import { Model } from "mongoose";
import { errorLog } from "src/helpers/do_loggers";
import { QueryDto } from "src/product/query.dto";
import { DepartmentService } from "./department.service";

@Injectable()
export class DepartmentHistoryService {
  constructor(@InjectModel(DepartmentHistory.name) private storeHistoryModel: Model<DepartmentHistory>, private readonly storeService: DepartmentService) { }

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
        createdAt: { $gte: start, $lte: end },
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
              ...(Object.keys(projection).length ? [{ $project: projection }] : [])
            ],
            totalCount: [{ $count: 'count' }]
          }
        },
        {
          $project: {
            history: '$data',
            totalDocuments: { $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0] }
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