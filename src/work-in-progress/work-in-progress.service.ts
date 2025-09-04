import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkInProgressDto } from './dto/create-work-in-progress.dto';
import { UpdateWorkInProgressDto } from './dto/update-work-in-progress.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkInProgress } from './work-in-progress.entity';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from 'src/helpers/query.dto';
import { DepartmentService } from 'src/department/department.service';
import { Department } from 'src/department/entities/department.entity';

@Injectable()
export class WorkInProgressService {
  constructor(
    @InjectModel(WorkInProgress.name) private workInProgress: Model<WorkInProgress>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
  ) { }
  async create(
    createWorkInProgressDto: any,
    req: any,
  ) {
    try {
      const { title, rawGoods, at } = createWorkInProgressDto;

      createWorkInProgressDto.location = req.user.location;
      createWorkInProgressDto.initiator = req.user.username;
      let sendingStore = await this.departmentModel.findById(at);


      if (!sendingStore) {
        throw new BadRequestException(`Can\'t Find This Department`)
      }

      let existingProcess = await this.workInProgress.findOne({ title: title.toLowerCase() });
      if (existingProcess) {
        for (const newRaw of rawGoods) {
          const existingIndex = existingProcess.rawGoods.findIndex(
            (raw) => raw.title === newRaw.title,
          );

          const product = sendingStore['RawGoods'].find((p) => p.productId.toString() === newRaw.productId);
          if (!product) {
            throw new NotFoundException(`Product "${title}" not found in department`);
          }
          if (product.quantity < newRaw.quantity) {
            throw new BadRequestException(`Insufficient stock for "${title}"`);
          }
          if (existingIndex !== -1) {
            existingProcess.rawGoods[existingIndex].quantity += newRaw.quantity;
            existingProcess.rawGoods[existingIndex].cost += newRaw.cost;
          } else {
            existingProcess.rawGoods.push(newRaw);
          }


          product.quantity -= newRaw.quantity;
          product.cost = product.quantity * product.unitCost
        }

        const rawGoodsTotal = existingProcess.rawGoods.reduce((sum, item) => sum + item.cost, 0);
        const otherCostsTotal = existingProcess.otherCosts.reduce((sum, item) => sum + item.cost, 0);
        existingProcess.totalCost = rawGoodsTotal + otherCostsTotal
        return await Promise.all([
          existingProcess.save(),
          sendingStore.save()
        ])
      }

      for (const newRaw of rawGoods) {
        const product = sendingStore['RawGoods'].find((p) => p.productId.toString() === newRaw.productId);
        if (!product) {
          throw new NotFoundException(`Product "${title}" not found in department`);
        }
        if (product.quantity < newRaw.quantity) {
          throw new BadRequestException(`Insufficient stock for "${title}"`);
        }

        console.log(product.quantity, newRaw.quantity)
        product.quantity -= newRaw.quantity;
        product.cost = product.quantity * product.unitCost
      }

      const rawGoodsTotal = rawGoods.reduce((sum, item) => sum + item.cost, 0);
      createWorkInProgressDto.totalCost = rawGoodsTotal

      const newProcess = new this.workInProgress(createWorkInProgressDto);
      return await Promise.all([
        newProcess.save(),
        sendingStore.save()
      ]);
    } catch (error) {
      errorLog(`Unable to Create Work In Progress - ${error}`)
      throw new BadRequestException(`Unable to Create Work In Progress - ${error}`)
    }
  }
  async findAll(query: QueryDto, req: any) {
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

      console.log({ ...parsedFilter, location: req.user.location }, select)
      if (query.startDate && query.endDate) {
        const startDate = new Date(query.startDate);
        startDate.setHours(0, 0, 0, 0); // Start of the startDate

        const endDate = new Date(query.endDate);
        endDate.setHours(24, 59, 59, 999);

      }

      const workInProgress = await this.workInProgress
        .find({ ...parsedFilter, location: req.user.location }) // Apply filtering
        .sort(parsedSort)   // Sorting
        .limit(Number(limit))
        .skip(Number(skip))
        .select(`${select}`)     // Projection of main document fields
        .exec();
      const totalDocuments = await this.workInProgress
        .countDocuments({ ...parsedFilter, location: req.user.location }); // Count total documents matching the filter

      return { workInProgress, totalDocuments };
    } catch (error) {
      errorLog(`Unable to Find All Work In Progress - ${error}`)
      throw new BadRequestException(`Unable to Find All Work In Progress - ${error}`)
    }
  }
  async findOne(id: string) {
    try {
      return await this.workInProgress.findById(id);
    } catch (error) {
      errorLog(`Unable to find this Work In Progress - ${error}`)
      throw new BadRequestException(`Unable to Find This Work In Progress - ${error}`)
    }
  }
  async update(id: string, updateWorkInProgressDto: UpdateWorkInProgressDto) {
    try {
      return await this.workInProgress.findByIdAndUpdate(id, { $set: updateWorkInProgressDto }, { new: true })
    } catch (error) {
      errorLog(`Error updating one Work In Progress: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
  async remove(id: string) {
    try {
      console.log(id)
      return this.workInProgress.findByIdAndDelete(id)
    } catch (error) {
      errorLog(`Error remove one  charge: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async doAddCost(id: string, costObj: { title: string, cost: number }, removetitle: string, totalCost: number) {
    try {
      const wip = await this.workInProgress.findById(id);
      if (!wip) {
        throw new BadRequestException(`Can\'t Find This Work In Progress`)
      }

      if (removetitle != '') {
        const existingCost = wip.otherCosts.findIndex(res => res.title == removetitle)
        if (existingCost != -1) {
          wip.otherCosts.splice(existingCost, 1)
          wip.totalCost = wip.totalCost - wip.otherCosts[existingCost].cost
        }
      } else {
        const existingCost = wip.otherCosts.findIndex(res => res.title == costObj.title)
        if (existingCost == -1) {
          wip.otherCosts.push(costObj)
          wip.totalCost = Number(wip.totalCost) + Number(costObj.cost)
        } else {
          wip.otherCosts[existingCost].cost = costObj.cost
          wip.totalCost = Number(wip.totalCost) + Number(costObj.cost)
        }
      }


      return await wip.save();
    } catch (error) {
      errorLog(`Error Adding New Cost - ${error}`)
      throw new BadRequestException(`Error Adding New Cost - ${error}`)
    }


  }
}