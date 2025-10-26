import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    console.log(createCartDto)

    const grouped = (createCartDto.cart || []).reduce((acc, item) => {
      const key = item.from;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const groups = Object.entries(grouped).map(([department, products]) => ({
      department,
      products,
    }));



    const data = {
      location: req.user.location,
      initiator: req.user.username,
      from: groups,
      total: Number(createCartDto.total),
      orderNo: Math.floor(1000 + Math.random() * 90000).toString(),
    }
    console.log(data);
    return await this.cartModel.create(data)
  }

  async findAll(query: QueryDto, req: any) {
    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
      startDate,
      endDate,
    } = query;

    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    const parsedFilter = JSON.parse(filter);
    const parsedSort = { createdAt: 1 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Main query filter
    const baseFilter: any = {
      ...parsedFilter,
      location: req.user.location,
      createdAt: { $gte: start, $lte: end },
    };

    const deptFilter = parsedFilter.department;
    if (deptFilter !== undefined) delete baseFilter.department;

    try {
      const pipeline: any[] = [
        { $match: baseFilter },
        { $sort: parsedSort },
        { $skip: Number(skip) },
      ];

      // Filter by department (if provided)
      if (deptFilter !== undefined) {
        pipeline.push({
          $addFields: {
            from: {
              $filter: {
                input: "$from",
                as: "f",
                cond: Array.isArray(deptFilter)
                  ? { $in: ["$$f.department", deptFilter] }
                  : { $eq: ["$$f.department", deptFilter] },
              },
            },
          },
        });

        // Exclude documents with empty 'from' array
        pipeline.push({
          $match: {
            from: { $ne: [] },
          },
        });
      }

      // Optional field projection
      if (select) {
        const projection = select.split(' ').reduce((acc, field) => {
          acc[field] = 1;
          return acc;
        }, {});
        pipeline.push({ $project: projection });
      }

      const carts = await this.cartModel.aggregate(pipeline).exec();
      console.log(carts)
      return carts;

    } catch (error) {
      errorLog(`Error finding all carts ${error}`, "ERROR");
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

  async update(id: string, updateCartDto: UpdateCartDto) {
    try {
      // Step 1: Get existing cart
      const existingCart = await this.cartModel.findById(id).exec();
      if (!existingCart) {
        throw new NotFoundException(`Cart with ID ${id} not found`);
      }

      // Step 2: Deep merge updateCartDto into existingCart (custom merge logic)
      deepMerge(existingCart, updateCartDto);

      // Step 3: Save updated document
      const updatedCart = await existingCart.save();

      return updatedCart;
    } catch (error) {
      errorLog(`Error updating cart ${id}: ${error}`, "ERROR");
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

function deepMerge(target: any, source: any) {
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    // Skip undefined
    if (sourceValue === undefined) continue;

    // If both are objects, recurse
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object'
    ) {
      deepMerge(targetValue, sourceValue);
    }

    // If it's an array, handle based on type
    else if (Array.isArray(sourceValue)) {
      if (Array.isArray(targetValue)) {
        // Smart merge for arrays of objects
        if (
          sourceValue.length &&
          typeof sourceValue[0] === 'object' &&
          sourceValue[0]._id
        ) {
          for (const updatedItem of sourceValue) {
            const index = targetValue.findIndex(
              (item) => String(item._id) === String(updatedItem._id)
            );
            if (index >= 0) {
              deepMerge(targetValue[index], updatedItem);
            } else {
              targetValue.push(updatedItem);
            }
          }
        } else {
          // Replace simple arrays
          target[key] = sourceValue;
        }
      } else {
        target[key] = sourceValue;
      }
    }

    // Primitive value — update only if changed
    else if (JSON.stringify(targetValue) !== JSON.stringify(sourceValue)) {
      target[key] = sourceValue;
    }
  }
}
