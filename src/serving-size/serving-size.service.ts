import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateServingSizeDto } from './dto/create-serving-size.dto';
import { UpdateServingSizeDto } from './dto/update-serving-size.dto';
import { ServingSize } from './entities/serving-size.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from 'src/helpers/query.dto';

@Injectable()
export class ServingSizeService {
  constructor(@InjectModel(ServingSize.name) private servingSizeModel: Model<ServingSize>) { }


  async create(createServingSizeDto: any, req: any) {
    try {
      createServingSizeDto.location = req.user.location;
      createServingSizeDto.initiator = req.user.username;
      return await this.servingSizeModel.create(createServingSizeDto);
    } catch (error) {
      errorLog(`Error create  serving Sizes: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async findAll(query: QueryDto, req) {
    try {
      const {
        filter = '{}',
        sort = '{}',
        limit = 10,
        skip = 0,
        select = '',
      } = query;
      const parsedFilter = JSON.parse(filter);
      const parsedSort = JSON.parse(sort);
      return await this.servingSizeModel.find({ ...parsedFilter, location: req.user.location })
        .sort({
          title: 1
        })
        .skip(Number(skip))
        // .limit(Number(limit))
        .select(select)
        .exec()
    } catch (error) {
      errorLog(`Error getting  serving Sizes: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }


  async findOne(ServingSizeId: string) {
    try {
      return await this.servingSizeModel.findById(ServingSizeId);
    } catch (error) {
      errorLog(`Error finding One Serving Size: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }


  async update(id: string, updateProductDto: any) {
    try {
      return await this.servingSizeModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();
    } catch (error) {
      errorLog(`Error updateing serving Sizes: ${error}`, "ERROR")
      throw new InternalServerErrorException(error);
    }
  }


  async remove(id: string) {
    try {
      return await this.servingSizeModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`Error remove  categories: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
}
