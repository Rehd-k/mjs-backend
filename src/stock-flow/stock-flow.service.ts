import { BadRequestException, Injectable, UseGuards } from '@nestjs/common';
import { CreateStockFlowDto } from './dto/create-stock-flow.dto';
import { UpdateStockFlowDto } from './dto/update-stock-flow.dto';
import { StockFlow } from './stock-flow.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from 'src/helpers/query.dto';
import { Role } from 'src/helpers/enums';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { RolesGuard } from 'src/helpers/roles/roles.guard';

@Injectable()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
export class StockFlowService {
  constructor(
    @InjectModel(StockFlow.name) private readonly stockFlowModel: Model<StockFlow>
  ) { }
  // woprking on balance brought down
  async create(
    title: string,
    product: string,
    quantity: number,
    stockFrom: Types.ObjectId | string,
    stockTo: Types.ObjectId | string,
    type: string,
    transactionDate: Date,
    initiator: string,
    location: string
  ) {

 
    try {
      // Get latest payment to derive current balances
      const lastPayment = await this.stockFlowModel.findOne().sort({ createdAt: -1 }).lean();

      const prevStockBalance = lastPayment?.stockBalanceAfter ?? 0;
      // Apply transaction
      const calcBalance = () => {
        if (type === 'in') {
          return prevStockBalance + quantity
        } else if (type === 'out') {
          return prevStockBalance + quantity
        }
        return prevStockBalance;
      }
      const stockBalanceAfter = calcBalance()

      const payment = new this.stockFlowModel({
        title,
        quantity,
        product,
        type,
        stockFrom,
        stockTo,
        transactionDate,
        location,
        initiator,
        stockBalanceAfter,
      });

      return await payment.save();
    } catch (error) {
      errorLog(`Error creating Stock Record ${error}`, "ERROR");
      throw new BadRequestException(error);
    }
  }

  async findAll(query: QueryDto, req: any) {
    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
    } = query;
    const parsedFilter = JSON.parse(filter);
    const parsedSort = JSON.parse(sort);

    try {
      return this.stockFlowModel.find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .skip(Number(skip))
        .select(select)
        .exec()
    } catch (error) {
      errorLog(`Error finding all Payments ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }
  async findOne(id: string) {
    try {
      return this.stockFlowModel.findById(id)
    } catch (error) {
      errorLog(`Error finding one Payments ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
  async update(id: number, updateCashflowDto: UpdateStockFlowDto) {
    try {
      return this.stockFlowModel.findByIdAndUpdate(id, updateCashflowDto, { new: true }).exec();
    } catch (error) {
      errorLog(`Error updating one payment: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
  async remove(id: string) {
    try {
      return this.stockFlowModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`Error removing one Payment: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
}
