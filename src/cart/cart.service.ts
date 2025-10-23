import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart } from './cart.entity';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>
  ) { }

  async create(createCartDto: any, req) {

    const data = {
      products: createCartDto,
      location: req.user.location,
      initiator: req.user.username
    }

    console.log(data)
    return await this.cartModel.create(data)
  }

  async findAll(query: QueryDto, req: any) {
    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
      startDate,
      endDate
    } = query;

    if (!startDate || !endDate) {
      throw new BadRequestException(`Start date and end date are required`);
    }
    const parsedFilter = JSON.parse(filter);
    const parsedSort = JSON.parse(sort);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(24, 59, 59, 999);

    parsedFilter.createdAt = { $gte: start, $lte: end };

    try {
      const carts = await this.cartModel.find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .skip(Number(skip))
        .select(select)
        .exec()
      return carts
    } catch (error) {
      errorLog(`Error finding all carts ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  findOne(id: string) {
    try {
      return this.cartModel.findById(id)
    } catch (error) {
      errorLog(`Error finding one cart ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  update(id: string, updateCartDto: UpdateCartDto) {
    try {
      return this.cartModel.findByIdAndUpdate(id, updateCartDto, { new: true }).exec();
    } catch (error) {
      errorLog(`Error updating one cart: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  remove(id: string) {
    try {
      return this.cartModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`Error removing one cart: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
}
