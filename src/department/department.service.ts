import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department } from './entities/department.entity'
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { StockFlowService } from 'src/stock-flow/stock-flow.service';
import { DepartmentHistory } from './entities/department.history.entity';

interface StockItem {
  product: string;
  title: string;
  price: number;
  toSend: number;
  cost: number;
  unitCost: number;
  productId: any
}

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    private readonly stockFlowService: StockFlowService,
    @InjectModel(DepartmentHistory.name) private departmentHistoryModel: Model<DepartmentHistory>,
  ) { }
  async create(createDepartmentDto: CreateDepartmentDto, req: any) {
    try {
      const newDepartmentData = new this.departmentModel(createDepartmentDto)
      newDepartmentData.initiator = req.user.username
      newDepartmentData.location = req.user.location
      const department = await newDepartmentData.save();

      return department;
    } catch (error) {
      errorLog(`Error creating one department: ${error}`, "ERROR")
      throw new BadRequestException(`Error creating one department: ${error.message}`);
    }

  }

  async findAll(req: any, query: any) {
    try {
      const department = await this.departmentModel.find({ ...query, location: req.user.location }).select('-products').exec()
      return department;
    } catch (error) {
      errorLog(`Error getting all department: ${error}`, "ERROR")
      throw new BadRequestException(`Error getting all department: ${error.message}`);
    }

  }

  async findOne(id: string, query: any) {
    try {
      const department = await this.departmentModel.findById(id)
        .select(`title description initiator type ${query.select}`)
        .populate({
          path: `${query.select}.productId`, // 👈 nested path populate
          model: `${query.select == 'RawGoods' ? 'RawMaterial' : 'Product'}`,
          // select: 'title price quantity type servingPrice cost servingQuantity',
        })
        .exec();
      return department;
    } catch (error) {
      errorLog(`Error getting one department: ${error}`, "ERROR")
      throw new NotFoundException(`Error getting one department: ${error.message}`);
    }
  }

  async getProductsForSell(id: string, query: any) {
    const { searchQuery, skip = 0, limit = 10 } = query;

    try {
      // Convert skip and limit to numbers
      const skipNum = parseInt(skip as string, 10) || 0;
      const limitNum = parseInt(limit as string, 10) || 10;

      const pipeline = [
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'products', // Adjust if your Product collection name is different
            localField: 'finishedGoods.productId',
            foreignField: '_id',
            as: 'tempProducts',
          },
        },
        {
          $addFields: {
            finishedGoods: {
              $map: {
                input: '$finishedGoods',
                as: 'fg',
                in: {
                  quantity: '$$fg.quantity',
                  product: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$tempProducts',
                          as: 'p',
                          cond: {
                            $eq: ['$$p._id', '$$fg.productId'],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            finishedGoods: {
              $filter: {
                input: '$finishedGoods',
                as: 'fg',
                cond: {
                  $regexMatch: {
                    input: '$$fg.product.title',
                    regex: searchQuery,
                    options: 'i', // Case-insensitive partial match
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            total: { $size: '$finishedGoods' }, // Total matching documents
            finishedGoods: {
              $sortArray: {
                input: '$finishedGoods',
                sortBy: { 'product.title': 1 }, // Sort alphabetically by product.title
              },
            },
          },
        },
        {
          $addFields: {
            finishedGoods: { $slice: ['$finishedGoods', skipNum, limitNum] }, // Paginate with converted numbers
          },
        },
        {
          $project: {
            _id: 1,
            finishedGoods: 1,
            total: 1, // Include total count of matching documents
          },
        },
        {
          $unset: ['tempProducts'], // Clean up temporary field
        },
      ];

      const result = await this.departmentModel.aggregate(pipeline).exec();

      return result[0] || null;

    } catch (error) {
      errorLog(`Error getting one department: ${error}`, "ERROR")
      throw new NotFoundException(`Error getting one department: ${error.message}`);
    }
  }


  /** Fetch a department by ID */
  private async getDepartmentById(id: string) {
    const department = await this.departmentModel.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  /** Decrease stock in a department */
  public decreaseStock(
    department: Department,
    section: string,
    productId: string,
    quantity: number,
    title: string,
  ): void {
    const product = department[section].find((p) => p.productId.toString() === productId.toString());
    if (!product) {
      throw new NotFoundException(`Product "${title}" not found in department`);
    }

    if (product.quantity < quantity) {
      throw new BadRequestException(`Insufficient stock for "${title}"`);
    }

    product.quantity -= quantity;
    product.cost = product.quantity * product.unitCost
  }

  /** Increase stock in a department */
  public increaseStock(
    department: any,
    section: string,
    productId: string,
    item: Omit<StockItem, 'toSend'> & { quantity: number },
    senderProduct: any,
  ): void {
    console.log(
      section,
      productId,
      item,
      senderProduct,
    )
    const product = department[section].find((p) => p.productId.toString() === productId.toString());
    if (product) {
      product.quantity += item.quantity;
      product.cost = product.quantity * product.unitCost
    } else {
      department[section].push({
        productId: new mongoose.Types.ObjectId(productId),
        title: item.title,
        cost: item.quantity * senderProduct.unitCost,
        unitCost: senderProduct.unitCost,
        quantity: item.quantity,
      });
    }
  }

  /** Transfer stock from one department to another */
  async sendOrReceiveStock(
    senderId: string,
    receiverId: string,
    section: string,
    body: StockItem[],
    req: any,
    newHistory: boolean
  ): Promise<boolean> {

    try {
      if (!senderId || !receiverId || !Array.isArray(body) || !section || body.length === 0) {
        throw new BadRequestException('Invalid request payload');
      }

      const [sender, receiver] = await Promise.all([
        this.getDepartmentById(senderId),
        this.getDepartmentById(receiverId),
      ]);

      for (const item of body) {

        const { toSend, productId } = item;

        if (!toSend || toSend <= 0) {
          throw new BadRequestException(`Invalid quantity for ${productId.title}`);
        }
        // Decrease stock from sender
        this.decreaseStock(sender, section, productId._id, toSend, productId.title);

        // Find sender product for copying details
        const senderProduct = sender[section].find((p) => p.productId.toString() === productId._id.toString());
        console.log(senderProduct)
        // Increase stock in receiver
        this.increaseStock(receiver, section, productId._id, { ...item, quantity: toSend }, senderProduct);
        if (newHistory) {
          await this.departmentHistoryModel.create({
            from: sender.title,
            fromId: sender._id,
            to: receiver.title,
            toId: receiver._id,
            products: body,
            section,
            location: req.user.location,
            closer: req.user.username,
            initiator: req.user.username,
          })
        }
        await this.stockFlowService.create('Stock Movement', productId.title, toSend, sender._id, receiver._id, 'contra', new Date(Date.now()), req.user.username, req.user.location)
      }

      await Promise.all([sender.save(), receiver.save()]);

      return true;
    } catch (error) {
      errorLog(`Error sending/receiving stock: ${error.message}`, 'ERROR');
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to process stock transfer');
    }
  }

  async update(id: string, updateDepartmentDto: any, filter: any) {
    try {
      const department = await this.departmentModel.findById(id)
      if (!department)
        throw new BadRequestException('Department Not Found')
      Object.entries(updateDepartmentDto).forEach(async ([key, value]) => {
        department[key] = value
      })
      return department.save();
    } catch (error) {
      errorLog(`Error updating one department: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async remove(id: string) {
    try {
      return await this.departmentModel.findByIdAndDelete(id);
    } catch (error) {
      errorLog(`Error removing one department: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }
}
