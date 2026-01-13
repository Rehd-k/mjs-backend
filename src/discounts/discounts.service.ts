import { BadRequestException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { Discount } from './discount.entity';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectModel(Discount.name) private readonly chargeModel: Model<Discount>
  ) { }
  async create(createDiscountDto: any, req: any) {
    try {
      createDiscountDto.location = req.user.location
      createDiscountDto.initiator = req.user.username
      const newDiscount = await this.chargeModel.create(createDiscountDto)
      return newDiscount;
    } catch (error) {
      errorLog(`Error creating  charge: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findAll(req: any) {
    try {
      const charges = await this.chargeModel.find({ location: req.user.location })
      return charges;
    } catch (error) {
      errorLog(`Error geting all  charge: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findOne(id: string) {
    try {
      const charges = await this.chargeModel.findOne({ _id: id })
      return charges;
    } catch (error) {
      errorLog(`Error geting one  charge: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async update(id: string, updateDiscountDto: any) {
    try {
      const charges = await this.chargeModel.findByIdAndUpdate(id, { $set: updateDiscountDto }, { new: true })
      return charges;
    } catch (error) {
      errorLog(`Error updating one  charge: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      return this.chargeModel.findByIdAndDelete(id)
    } catch (error) {
      errorLog(`Error remove one  charge: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }
}
