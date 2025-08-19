import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { Charge } from './entities/charge.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class ChargesService {
  constructor(
    @InjectModel(Charge.name) private readonly chargeModel: Model<Charge>
  ) { }
  async create(createChargeDto: any, req: any) {
    try {
      createChargeDto.location = req.user.location
      createChargeDto.initiator = req.user.username
      const newCharge = await this.chargeModel.create(createChargeDto)
      return newCharge;
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

  async update(id: string, updateChargeDto: UpdateChargeDto) {
    try {
      const charges = await this.chargeModel.findByIdAndUpdate(id, { $set: updateChargeDto }, { new: true })
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
