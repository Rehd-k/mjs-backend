import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';
import { CustomerService } from 'src/customer/customer.service';


@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>, private readonly customerService: CustomerService) { }

    async create(user: any) {

        try {
            if (user.role === 'god') {
                user.initiator = 'god'
            }
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

    async findOneByUsername(username: string) {
        try {
            return this.userModel.findOne({ username });
        } catch (error) {
            errorLog(`error finding user by username ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getUsersByDepartment(department: string, req) {
        const user = await this.userModel.find({ department: department, location: req.user.location }).select('role')
        return user;
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

            console.log(parsedFilter)

            const user = await this.userModel.find({ ...parsedFilter, location: req.user.location })
                .sort(parsedSort)
                .skip(Number(skip))
                .limit(Number(limit))
                .select(select)
                // .populate('location')
                .exec()
            console.log(user)

            return user;
        } catch (error) {
            errorLog(`error finding all users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getOneById(id: string) {
        try {
            const user = await this.userModel.findById(id);

            return user;
        } catch (error) {
            errorLog(`error finding one users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async findOne(query: any) {
        try {
            const user = await this.userModel.findOne(query);

            return user;
        } catch (error) {
            errorLog(`error finding one users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async updateOneById(id: string, user: Partial<User>, req: any) {

        try {
            const updatedUser = await this.userModel.findByIdAndUpdate(id, user, { new: true });

            if (user.credit_sale === true && updatedUser) {
                if (!updatedUser.customer) {
                    const cusOBJ = {
                        name: `${updatedUser.lastName} ${updatedUser.firstName}`,
                        email: `${updatedUser.email}`,
                        phone_number: `${updatedUser.phone_number ?? ' '}`,
                        address: `${updatedUser.address}`,
                    }

                    const newCustomer = await this.customerService.createCustomer(cusOBJ, req);
                    updatedUser.customer = newCustomer._id;
                    await updatedUser.save();
                }
            }

        } catch (error) {
            errorLog(`error updating one users ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async getUsersByRole(role: string, req: any) {
        try {
            return this.userModel.find({ role: role, location: req.user.location });
        } catch (error) {
            errorLog(`error getting users by role ${error}`, "ERROR")
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
