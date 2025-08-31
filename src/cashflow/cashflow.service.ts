import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateCashflowDto } from './dto/update-cashflow.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cashflow } from './cashflow.entity';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from './query.dto';


@Injectable()
export class CashflowService {
  constructor(
    @InjectModel(Cashflow.name) private readonly cashflowModel: Model<Cashflow>
  ) { }

  // woprking on balance brought down
async createPayment(documentToPay: any) {
 
  try {
    const { 
      title, 
      paymentFor, 
      cash = 0, 
      bank = 0, 
      type, 
      moneyFrom, 
      transactionDate, 
      initiator, 
      location 
    } = documentToPay;

  

    // Get latest payment to derive current balances
    const lastPayment = await this.cashflowModel.findOne().sort({ createdAt: -1 }).lean();

    const prevCashBalance = lastPayment?.CashBalanceAfter ?? 0;
    const prevBankBalance = lastPayment?.BankBalanceAfter ?? 0;

    // Apply transaction
    const CashBalanceAfter = type === 'in' ? prevCashBalance + cash : prevCashBalance - cash;
    const BankBalanceAfter = type === 'in' ? prevBankBalance + bank : prevBankBalance - bank;

    const payment = new this.cashflowModel({
      title,
      paymentFor,
      cash,
      bank,
      type,
      moneyFrom,
      transactionDate,
      initiator,
      location,
      CashBalanceAfter,
      BankBalanceAfter,
    });

    return await payment.save();
  } catch (error) {
    errorLog(`Error creating Payment ${error}`, "ERROR");
    throw new BadRequestException(error);
  }
}


  findAll(query: QueryDto, req: any) {
    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
    } = query;
    const parsedFilter = JSON.parse(filter);
    const parsedSort = JSON.parse(sort);

    try {
      return this.cashflowModel.find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .skip(Number(skip))
        .select(select)
        .exec()
    } catch (error) {
      errorLog(`Error finding all Payments ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  findOne(id: string) {
    try {
      return this.cashflowModel.findById(id)
    } catch (error) {
      errorLog(`Error finding one Payments ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async update(id: number, updateCashflowDto: UpdateCashflowDto) {

    try {
      return this.cashflowModel.findByIdAndUpdate(id, updateCashflowDto, { new: true }).exec();
    } catch (error) {
      errorLog(`Error updating one payment: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      return this.cashflowModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`Error removing one Payment: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
}
