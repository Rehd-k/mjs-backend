import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateReqisitionDto } from './dto/create-reqisition.dto';
import { UpdateReqisitionDto } from './dto/update-reqisition.dto';
import { Reqisition } from './reqisition.entity';
import { InjectModel } from '@nestjs/mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { Model } from 'mongoose';

@Injectable()
export class ReqisitionService {
  constructor(
    @InjectModel(Reqisition.name) private readonly reqisitionModel: Model<Reqisition>
  ) { }
  async create(createReqisitionDto: any, req: any) {
    try {
      createReqisitionDto.location = req.user.location
      createReqisitionDto.initiator = req.user.username
      const newReqisition = await this.reqisitionModel.create(createReqisitionDto)
      return newReqisition;
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
