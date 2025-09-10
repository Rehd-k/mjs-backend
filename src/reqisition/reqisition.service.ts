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

  async findAll(req: any) {
    try {
      const reqisitions = await this.reqisitionModel.find({ location: req.user.location })
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
