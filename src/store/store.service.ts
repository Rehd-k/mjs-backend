import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './entities/store.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class StoreService {
  constructor(@InjectModel(Store.name) private storeModel: Model<Store>) { }
  async create(createStoreDto: CreateStoreDto) {
    try {
      const newStoreData = new this.storeModel(createStoreDto)
      return newStoreData.save();
    } catch (error) {
      errorLog(`Error creating one store: ${error}`, "ERROR")
      throw new Error(`Error creating one store: ${error.message}`);
    }

  }

  async findAll(req: any) {
    try {
      return this.storeModel.find({ location: req.user.location });
    } catch (error) {
      errorLog(`Error getting all store: ${error}`, "ERROR")
      throw new Error(`Error getting all store: ${error.message}`);
    }

  }

  findOne(id: string) {
    try {
      return this.storeModel.findById(id)
    } catch (error) {
      errorLog(`Error getting one store: ${error}`, "ERROR")
      throw new Error(`Error getting one store: ${error.message}`);
    }

  }

  async update(id: string, updateStoreDto: any) {
    try {
      const store = await this.storeModel.findById(id)
      if (!store)
        throw new BadRequestException('Store Not Found')
      Object.entries(updateStoreDto).forEach(async ([key, value]) => {
        store[key] = value
      })
      return store.save();
    } catch (error) {
      errorLog(`Error updating one store: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  remove(id: string) {
    try {
      return this.storeModel.findByIdAndDelete(id);
    } catch (error) {
      errorLog(`Error removing one store: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }
}
