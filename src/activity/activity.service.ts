import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActivityLog } from './activity.schema';
import { Model } from 'mongoose';
import { QueryDto } from 'src/product/query.dto';



@Injectable()
export class ActivityService {
    constructor(@InjectModel(ActivityLog.name) private readonly activityLogModel: Model<ActivityLog>) { }

    async logAction(userId: string, username: string, action: string, location: string, details?: string) {
        const log = new this.activityLogModel({ userId, username, action, details, location });
        return await log.save();
    }

    async getLogs(query: QueryDto, req: any) {
        const {
            filter = '{}',
            sort = '{}',
            limit = 10,
            skip = 0,
            select = '',
        } = query;
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);
        return await this.activityLogModel
            .find({ ...parsedFilter, location: req.user.location })
            .sort(parsedSort)
            .skip(Number(skip))
            .limit(Number(limit))
            .select(select)
            .exec()
    }
}
