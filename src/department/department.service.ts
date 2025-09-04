import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department } from './entities/department.entity'
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { errorLog } from 'src/helpers/do_loggers';

interface StockItem {
  productId: string;
  title: string;
  price: number;
  toSend: number;
  cost: number;
  unitCost: number;
}

@Injectable()
export class DepartmentService {
  constructor(@InjectModel(Department.name) private departmentModel: Model<Department>) { }
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
        // .populate({
        //   path: 'products.product', // 👈 nested path populate
        //   model: 'Product',
        //   select: 'title price quantity type cartonAmount'
        // })
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
      const department = await this.departmentModel.aggregate([
        // 1. Match parent doc
        { $match: { _id: new mongoose.Types.ObjectId(id) } },

        // 2. Filter products by title
        {
          $addFields: {
            filteredProducts: {
              $filter: {
                input: "$products",
                as: "p",
                cond: {
                  $regexMatch: {
                    input: "$$p.title",
                    regex: searchQuery,   // ← your frontend search query
                    options: "i"          // case-insensitive
                  }
                }
              }
            }
          }
        },

        // Sort the filtered array alphabetically by title
        {
          $addFields: {
            filteredProducts: {
              $sortArray: {
                input: "$filteredProducts",
                sortBy: { title: 1 } // ascending, use -1 for descending
              }
            }
          }
        },

        // 3. Slice the filtered products for pagination
        {
          $project: {
            total: 1,
            products: { $slice: ["$filteredProducts", Number(skip), Number(limit)] },
            totalDocuments: { $size: "$filteredProducts" } // for pagination metadata
          }
        }
      ]);
      return department[0]
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
    const product = department[section].find((p) => p.productId.toString() === productId);

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
    const product = department[section].find((p) => p.productId.toString() === productId);

    if (product) {
      product.quantity += item.quantity;
      product.cost = product.quantity * product.unitCost
    } else {
      department[section].push({
        productId: new mongoose.Types.ObjectId(productId),
        title: item.title,
        price: item.price,
        cost: item.quantity * item.unitCost,
        unitCost: item.unitCost,
        quantity: item.quantity,
        type: senderProduct.type,
        servingSize: senderProduct.servingSize,
        servingPrice: senderProduct.servingPrice,
        sellUnits: senderProduct.sellUnits,
      });
    }
  }

  /** Transfer stock from one department to another */
  async sendOrReceiveStock(
    senderId: string,
    receiverId: string,
    section: string,
    body: StockItem[],
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
        const { productId, title, toSend } = item;

        if (!toSend || toSend <= 0) {
          throw new BadRequestException(`Invalid quantity for ${title}`);
        }

        // Decrease stock from sender
        this.decreaseStock(sender, section, productId, toSend, title);

        // Find sender product for copying details
        const senderProduct = sender[section].find((p) => p.productId.toString() === productId);

        // Increase stock in receiver
        this.increaseStock(receiver, section, productId, { ...item, quantity: toSend }, senderProduct);
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


  async sendOrReceive(
    senderId: string,
    receiverId: string,
    body: { productId: string; title: string; price: number; toSend: number }[]
  ): Promise<boolean> {
    try {
      if (!senderId || !receiverId || !Array.isArray(body) || body.length === 0) {
        throw new BadRequestException('Invalid request payload');
      }

      const [sender, receiver] = await Promise.all([
        this.departmentModel.findById(senderId),
        this.departmentModel.findById(receiverId),
      ]);


      if (!sender) throw new NotFoundException('Sender department not found');
      if (!receiver) throw new NotFoundException('Receiver department not found');

      // Convert products to Map for faster access
      const senderProducts = new Map(
        sender.finishedGoods.map((p) => [p.productId.toString(), p])
      );
      const receiverProducts = new Map(
        receiver.finishedGoods.map((p) => [p.productId.toString(), p])
      );

      for (const item of body) {
        const { productId, title, price, toSend } = item;

        if (!toSend || toSend <= 0) {
          throw new BadRequestException(`Invalid quantity for ${title}`);
        }

        // Update sender stock
        const sendingProduct = senderProducts.get(productId);
        if (!sendingProduct) {
          throw new NotFoundException(
            `Product "${title}" not found in sender's department`
          );
        }
        if (sendingProduct.quantity < toSend) {
          throw new BadRequestException(
            `Insufficient stock for "${title}" at sender's department`
          );
        }
        sendingProduct.quantity -= toSend;

        // Update or add receiver stock
        const receivingProduct = receiverProducts.get(productId);
        if (receivingProduct) {
          receivingProduct.quantity += toSend;
        } else {
          receiver.finishedGoods.push({
            productId: new mongoose.Types.ObjectId(productId),
            title,
            price,
            quantity: toSend,
            type: sendingProduct.type,
            servingSize: sendingProduct.servingSize,
            servingPrice: sendingProduct.servingPrice,
            sellUnits: sendingProduct.sellUnits
          });
        }
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
