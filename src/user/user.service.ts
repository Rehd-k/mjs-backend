import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';


@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }

    async create(user: any) {
        try {
            if (user.role === 'god')
                user.initiator = 'god'
            return await this.userModel.create(user);
        } catch (error) {
            if (error && error.code === 11000) {
                let errMessage = `User with username / email already exists`;
                errorLog(`${errMessage}`, "ERROR")
                throw new BadRequestException(errMessage);
            }
            if (error && error.name === "ValidationError")
                errorLog(`ValidationError ${error}`, "ERROR")
            throw new InternalServerErrorException(error.message);
        }
    }

    async findOneByUsername(username: string, location?: string) {
        try {
            return this.userModel.findOne({ username, location });
        } catch (error) {
            errorLog(`error finding user by username ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getAllUsers(query: QueryDto, req) {

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

            const user = await this.userModel.find({ ...parsedFilter, location: req.user.location })
                .sort(parsedSort)
                .skip(Number(skip))
                .limit(Number(limit))
                .select(select)
                // .populate('location')
                .exec()

            return user;
        } catch (error) {
            errorLog(`error finding all users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getOneById(id: string) {
        try {
            const user = await  this.userModel.findById(id);
            console.log(user)
            return user;
        } catch (error) {
            errorLog(`error finding one users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async updateOneById(id: string, user: Partial<User>) {
        try {
            return this.userModel.findByIdAndUpdate(id, user, { new: true });
        } catch (error) {
            errorLog(`error updating one users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async deleteOneById(id: string) {
        try {
            return this.userModel.findByIdAndDelete(id);
        } catch (error) {
            errorLog(`error deleting one users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }
}
