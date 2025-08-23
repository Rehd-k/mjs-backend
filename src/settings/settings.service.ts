import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './entities/setting.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Setting.name) private settingsModel: Model<Setting>) { }
  async create(createSettingDto: any, req: any) {
    try {
      createSettingDto.initiatior = req.user.username
      createSettingDto.location = req.user.location;
      return await this.settingsModel.create(createSettingDto)
    } catch (error) {
      errorLog(`Error creating setting ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findAll() {
    try {
      return await this.settingsModel.find().exec();
    } catch (error) {
      errorLog(`Error finding all setting ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findOne(id: string) {
    try {
      return await this.settingsModel.findById(id).exec();
    } catch (error) {
      errorLog(`Error finding one setting ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async update(id: string, updateSettingDto: UpdateSettingDto) {
    try {
      return await this.settingsModel.findByIdAndUpdate(id, { $set: updateSettingDto }, { new: true }).exec();
    } catch (error) {
      errorLog(`Error updating one setting ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async remove(id: string) {
    try {
      return await this.settingsModel.findOneAndDelete()
    } catch (error) {
      errorLog(`Error updating one setting ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }
}
