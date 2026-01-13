import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart } from './cart.entity';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DepartmentService } from 'src/department/department.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    private readonly notificationService: NotificationsService,
    private readonly userService: UserService
  ) { }

  async create(createCartDto: any, req) {
    console.log(createCartDto)
    let rolesToAlert: string[] = [];
    const cart = await this.saveCartToDb(createCartDto, req.user.location, req.user.username);

    for (const element of cart.from) {
      const user = await this.userService.getUsersByDepartment(element.department, req);
      for (const element of user) {
        if (element.role === 'chef') {
          rolesToAlert.push('chef')
        }
        if (element.role === 'bar') {
          rolesToAlert.push('bar')
        }
      }
    }
    this.notificationService.createNotificationForRoles(`New Order with No ${cart.orderNo}`, rolesToAlert, 'New Order', req)
    return cart
  }

  private async saveCartToDb(createCartDto: any, location: any, initiator: any) {
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
      location: location,
      initiator: initiator,
      from: groups,
      total: Number(createCartDto.total),
      orderNo: Math.floor(1000 + Math.random() * 90000).toString(),
    };

    const cart = await this.cartModel.create(data);
    return cart;
  }

  async updateOrderFromWaiter(createCartDto: any, req: any) {
    let rolesToAlert: string[] = [];
    const cart = await this.cartModel.findById(createCartDto._id);
    if (!cart)
      throw new NotFoundException(`Cart with ID ${createCartDto._id} not found`);
    const grouped = (createCartDto.cart || []).reduce((acc, item) => {
      const key = item.from;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const groups: { department: string; products: any[] }[] = Object.entries(grouped).map(([department, products]) => ({
      department,
      products: products as any[],
    }));


    cart!.from = groups;
    cart!.total = Number(createCartDto.total);

    for (const element of cart.from) {
      const user = await this.userService.getUsersByDepartment(element.department, req);
      for (const element of user) {
        if (element.role === 'chef') {
          rolesToAlert.push('chef')
        }
        if (element.role === 'bar') {
          rolesToAlert.push('bar')
        }
      }
    }
    this.notificationService.createNotificationForRoles(`Update to order ${cart.orderNo}`, rolesToAlert, 'Order Update', req)

    return await cart.save();
  }


  async updateCart(id: string, createCartDto: any) {
    try {
      const updateCart = await this.cartModel.findByIdAndUpdate(id, createCartDto, { new: true }).exec();
      if (!updateCart) {
        throw new NotFoundException('Cart Now Found');
      }
      return updateCart;
    } catch (error) {
      errorLog(`Error updating cart: ${error.message}`, "ERROR")
      throw new Error(`Error updating cart: ${error.message}`);
    }
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

      return carts;

    } catch (error) {
      errorLog(`Error finding all carts ${error}`, "ERROR");
      throw new BadRequestException(error);
    }
  }

  async doSplit(updateCartDto: any) {
    const cart = await this.cartModel.findById(updateCartDto._id);

    try {
      if (!updateCartDto?._id) throw new BadRequestException('Missing cart _id');
      const cart = await this.cartModel.findById(updateCartDto._id);
      if (!cart) throw new NotFoundException(`Cart with ID ${updateCartDto._id} not found`);

      if (!Array.isArray(updateCartDto.cart)) {
        // nothing to do
        return await cart.save();
      }

      // Iterate through each incoming update item
      for (const incoming of updateCartDto.cart) {
        const productId = incoming.productId
        const toSend = Number(incoming.toSend ?? 0);
        if (!productId || !toSend) {
          // skip items without productId or no toSend amount
          if ('toSend' in incoming) delete incoming.toSend;
          continue;
        }

        // Find the first product across cart.from[*].products that matches productId
        let found = false;
        for (const fromEntry of cart.from || []) {
          if (!Array.isArray(fromEntry.products)) continue;
          const prod = fromEntry.products.find(
            (p: any) => String(p.productId ?? p._id) === String(productId)
          );
          if (prod) {
            // Reduce the quantity by toSend (never below 0)
            const currentQty = Number(prod.quantity ?? 0);
            prod.quantity = Math.max(0, currentQty - toSend);
            prod.total = prod.quantity * prod.price



            // Update the incoming object: set its quantity to the toSend value (as requested)
            incoming.quantity = toSend;
            incoming.total = toSend * prod.price

            // Remove toSend from the incoming object
            delete incoming.toSend;
            // Remove product if quantity is 0 or less
            if (prod.quantity <= 0) {
              fromEntry.products.splice(fromEntry.products.indexOf(prod), 1);
            }
            found = true;
            break; // only adjust the first matching product
          }
        }

        // If not found, still remove toSend so updateCartDto is cleaned up
        if (!found && 'toSend' in incoming) {
          delete incoming.toSend;
        }
      }
      cart.total = updateCartDto.oldTotal
      // Save the modified cart document
      const saved = await cart.save();

      // Log the mutated updateCartDto.cart
      await this.saveCartToDb(updateCartDto, cart.location, cart.initiator)
      console.log(updateCartDto.cart);

      return saved;
    } catch (error) {
      errorLog(`Error in doSplit: ${error}`, "ERROR");
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
      errorLog(`Error updating cart ${id}: ${error} `, "ERROR");
      throw new BadRequestException(error);
    }
  }


  remove(id: string) {
    try {
      return this.cartModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`Error removing one cart: ${error} `, "ERROR")
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
