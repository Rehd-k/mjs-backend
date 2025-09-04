import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RawMaterial } from './raw-material.entity';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from 'src/helpers/query.dto';

@Injectable()
export class RawMaterialService {
  constructor(@InjectModel(RawMaterial.name) private rawMaterialModel: Model<RawMaterial>) { }

  async create(createRawMaterialDto: any, req: any): Promise<RawMaterial> {
    try {
      createRawMaterialDto.location = req.user.location;
      createRawMaterialDto.title = createRawMaterialDto.title.toLowerCase();
      createRawMaterialDto.initiator = req.user.username;
      const createdMaterial = new this.rawMaterialModel(createRawMaterialDto);
      return await createdMaterial.save();
    } catch (error) {
      errorLog(`Error createing Raw Material ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async findAll(query: QueryDto, req: any): Promise<{ materials: RawMaterial[], totalDocuments: number }> {
    const {
      filter = '{}',
      sort = '{}',
      limit = 10,
      skip = 0,
      select = '',
    } = query;
    const parsedFilter = JSON.parse(filter);
    const parsedSort = JSON.parse(sort);

    // If the filter contains a 'barcode' key, set skip to 0
    if (parsedFilter && typeof parsedFilter === 'object' && 'barcode' in parsedFilter) {
      query.skip = 0;
      if (parsedFilter.barcode['$regex'])
        parsedFilter.barcode['$regex'] = parsedFilter.barcode['$regex'].toUpperCase();
    }
    try {


      const materials = await this.rawMaterialModel
        .find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .skip(Number(skip))
        .limit(Number(limit))
        .select(select)
        .exec();

      const totalDocuments = await this.rawMaterialModel
        .countDocuments({ ...parsedFilter, location: req.user.location })
        .exec();

      return { materials, totalDocuments };
    } catch (error) {
      errorLog('Error in findAll Materials:', error)
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: string) {
    try {
      return await this.rawMaterialModel.findById(id).exec();
    } catch (error) {
      errorLog(`Error finding this producs ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async increaseAmount(id: string, amount: number) {
    try {
      const material = await this.rawMaterialModel.findById(id).exec();
      if (!material) {
        throw new BadRequestException('material not found');
      }
      let dbquantity = material.quantity
      let newquantity = dbquantity + amount
      material.quantity = newquantity;
      return await material.save();
    } catch (error) {
      errorLog(`Error increacing amount ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async decreaseAmount(id: string, amount: number): Promise<RawMaterial> {
    try {
      const material = await this.rawMaterialModel.findById(id).exec();
      if (!material) {
        throw new BadRequestException('material not found');
      }
      material.quantity -= amount;
      return await material.save();
    } catch (error) {
      errorLog(`Error decreasing amount ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }


  async update(id: String, updateMaterialDto: any) {
    try {
      return await this.rawMaterialModel.findByIdAndUpdate(id, updateMaterialDto).exec();
    } catch (error) {
      errorLog(`Error updating materials ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.rawMaterialModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`Error removing material ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
}
