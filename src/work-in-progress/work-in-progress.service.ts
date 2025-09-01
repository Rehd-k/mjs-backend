import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWorkInProgressDto } from './dto/create-work-in-progress.dto';
import { UpdateWorkInProgressDto } from './dto/update-work-in-progress.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkInProgress } from './work-in-progress.entity';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from 'src/helpers/query.dto';

@Injectable()
export class WorkInProgressService {
  constructor(
    @InjectModel(WorkInProgress.name) private workInProgress: Model<WorkInProgress>
  ) { }
  async create(createWorkInProgressDto: any, req: any) {
    try {
      createWorkInProgressDto.location = req.user.location;
      createWorkInProgressDto.initiator = req.user.username;
      return await this.workInProgress.create(createWorkInProgressDto)
    } catch (error) {
      errorLog(`Unable to Create Work In Progress - ${error}`)
      throw new BadRequestException(`Unable to Create Work In Progress - ${error}`)
    }
  }

  async findAll(query: QueryDto, req: any) {

    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
      limit = 10
    } = query;
    try {
      const parsedFilter = JSON.parse(filter);
      const parsedSort = JSON.parse(sort);

      if (!query.startDate || !query.endDate) {
        throw new BadRequestException('startDate and endDate are required');
      }

      const startDate = new Date(query.startDate);
      startDate.setHours(0, 0, 0, 0); // Start of the startDate

      const endDate = new Date(query.endDate);
      endDate.setHours(24, 59, 59, 999);


      const workInProgress = await this.workInProgress
        .find({ ...parsedFilter, location: req.user.location }) // Apply filtering
        .sort(parsedSort)   // Sorting
        .limit(Number(limit))
        .skip(Number(skip))
        .select(`${select}`)     // Projection of main document fields
        .exec();
      const totalDocuments = await this.workInProgress
        .countDocuments({ ...parsedFilter, location: req.user.location }); // Count total documents matching the filter

      return { workInProgress, totalDocuments };
    } catch (error) {
      errorLog(`Unable to Find All Work In Progress - ${error}`)
      throw new BadRequestException(`Unable to Find All Work In Progress - ${error}`)
    }
  }


  async findOne(id: string) {
    try {
      return await this.workInProgress.findById(id);
    } catch (error) {
      errorLog(`Unable to find this Work In Progress - ${error}`)
      throw new BadRequestException(`Unable to Find This Work In Progress - ${error}`)
    }
  }

  async update(id: string, updateWorkInProgressDto: UpdateWorkInProgressDto) {
    try {
      return await this.workInProgress.findByIdAndUpdate(id, { $set: updateWorkInProgressDto }, { new: true })
    } catch (error) {
      errorLog(`Error updating one Work In Progress: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      return this.workInProgress.findByIdAndDelete(id)
    } catch (error) {
      errorLog(`Error remove one  charge: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
}