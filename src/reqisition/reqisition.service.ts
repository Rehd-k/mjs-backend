import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateReqisitionDto } from './dto/create-reqisition.dto';
import { UpdateReqisitionDto } from './dto/update-reqisition.dto';
import { Reqisition } from './reqisition.entity';
import { InjectModel } from '@nestjs/mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { Model } from 'mongoose';
import { DepartmentService } from 'src/department/department.service';
import { fork } from 'node:child_process';
import { DepartmentHistoryService } from 'src/department/department.history.service';

@Injectable()
export class ReqisitionService {
  constructor(
    @InjectModel(Reqisition.name) private readonly reqisitionModel: Model<Reqisition>,
    private readonly departmentService: DepartmentHistoryService
  ) { }
  async create(createReqisitionDto: any, req: any) {
    try {
      createReqisitionDto.location = req.user.location
      createReqisitionDto.initiator = req.user.username
      const newReqisition = await this.reqisitionModel.create(createReqisitionDto)
      const groupedProducts: { [key: string]: { name: string, departmentId: string, products: any[] } } = {};
      for (const product of createReqisitionDto.products) {
        const fromId = product.fromName._id;
        const fromTitle = product.fromName.title;
        product.product = product.productId
        delete product.fromName
        if (!groupedProducts[fromId]) {
          groupedProducts[fromId] = { name: fromTitle, departmentId: fromId, products: [] };
        }
        groupedProducts[fromId].products.push(product);
      }
      const groupedArray = Object.values(groupedProducts);

      for (const element of groupedArray) {
        const newData = {
          from: element.name,
          to: createReqisitionDto.to,
          products: element.products,
          fromId: element.departmentId,
          closer: req.user.username
        }
        await this.departmentService.createHistory(newData, req);
      }


      return { 'newReqisition': '' };
    } catch (error) {
      errorLog(`Error creating  reqisition: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findAll(req: any, query: any) {
    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
      limit = 10,
      startDate,
      endDate,
      selectedDateField,
    } = query;
    const parsedFilter = JSON.parse(filter);
    const parsedSort = JSON.parse(sort);

    try {
      if (startDate && endDate && selectedDateField) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        parsedFilter[selectedDateField] = { $gte: start, $lte: end };
      }
      const reqisitions = await this.reqisitionModel
        .find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .limit(Number(limit))
        .skip(Number(skip))
        .select(select)
        .exec()
      return reqisitions;
    } catch (error) {
      errorLog(`Error geting all  reqisition: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findOne(id: string) {
    try {
      const reqisitions = await this.reqisitionModel.findOne({ _id: id })
      return reqisitions;
    } catch (error) {
      errorLog(`Error geting one  reqisition: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async update(id: string, updateReqisitionDto: UpdateReqisitionDto) {
    try {
      const reqisitions = await this.reqisitionModel.findByIdAndUpdate(id, { $set: updateReqisitionDto }, { new: true })
      return reqisitions;
    } catch (error) {
      errorLog(`Error updating one  reqisition: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      return this.reqisitionModel.findByIdAndDelete(id)
    } catch (error) {
      errorLog(`Error remove one  reqisition: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }
}
