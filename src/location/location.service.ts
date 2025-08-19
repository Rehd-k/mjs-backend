import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Location } from './location.schema';
import { Model } from 'mongoose';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class LocationService {
    constructor(@InjectModel(Location.name) private readonly locationModel: Model<Location>) { }

    async createStore(name: string, location: string, manager: string, contact: string, req: any, firm_name : string) {
        try {
            const store = new this.locationModel({ name, location, manager, contact, initiator: "admin", firm_name });
            return await store.save();
        } catch (error) {
            errorLog(`Error creating one store: ${error}`, "ERROR")
            throw new Error(`Error creating one store: ${error.message}`);
        }

    }

    async getStores(query: QueryDto) {
        try {
            const {
                filter = '{}',
                sort = '{}',
                skip = 0,
                select = '',
                limit = 10,
                startDate,
                endDate,
                selectedDateField
            } = query;

            const parsedFilter = JSON.parse(filter);
            const parsedSort = JSON.parse(sort);
            return await this.locationModel.find(parsedFilter)
                .sort(parsedSort)
                .skip(Number(skip))
                .limit(Number(limit))
                .select(select)
                .exec();
        } catch (error) {
            errorLog(`Error getting all store: ${error}`, "ERROR")
            throw new Error(`Error getting all store: ${error.message}`);
        }

    }

    async getStoreById(storeId: string) {
        try {
            return await this.locationModel.findById(storeId);
        } catch (error) {
            errorLog(`Error getting one store: ${error}`, "ERROR")
            throw new Error(`Error getting one store: ${error.message}`);
        }

    }

    async update(id: string, updateProductDto: any) {
        try {
            return await this.locationModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();
        } catch (error) {
            errorLog(`Error updating one store: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async remove(id: string){
        try {
            return await this.locationModel.findByIdAndDelete(id).exec();
        } catch (error) {
            errorLog(`Error removing one store: ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }
}
