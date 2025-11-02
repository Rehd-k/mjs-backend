import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateCashflowDto } from './dto/update-cashflow.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cashflow } from './cashflow.entity';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from './query.dto';
import { retry } from 'rxjs';


@Injectable()
export class CashflowService {
  constructor(
    @InjectModel(Cashflow.name) private readonly cashflowModel: Model<Cashflow>
  ) { }

  // woprking on balance brought down
  async createPayment(
    title: string,
    paymentFor: string,
    cash: number,
    bank: number,
    type: string,
    moneyFrom = '',
    transactionDate: Date,
    initiator: string,
    location: string
  ) {

    try {
      // Get latest payment to derive current balances



      let amount = bank + cash;
      const lastPayment = await this.cashflowModel.findOne({
        moneyFrom: moneyFrom
      }).sort({ createdAt: -1 }).lean();

      const prevBalance = lastPayment?.balanceAfter ?? 0;

      // Apply transaction
      const balanceAfter = type === 'in' ? prevBalance + amount : prevBalance - amount;

      const payment = new this.cashflowModel({
        title,
        paymentFor,
        amount,
        type,
        moneyFrom,
        transactionDate,
        initiator,
        location,
        balanceAfter
      });

      return await payment.save();

    } catch (error) {
      errorLog(`Error creating Payment ${error}`, "ERROR");
      throw new BadRequestException(error);
    }
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

    // Fetch the last transaction before the start date that matches the filters (excluding date filter)
    const previousFilter = { ...parsedFilter };
    delete previousFilter.createdAt; // Remove date filter for previous transaction

    const previousTransactionPromise = await this.cashflowModel
      .findOne({
        ...previousFilter,
        location: req.user.location,
        createdAt: { $lt: start }
      })
      .sort({ createdAt: -1 })
      .select(select)
      .lean();

    // Store the promise to fetch previous transaction, to be awaited later
    const previousTransaction = previousTransactionPromise;


    try {
      const transactions = await this.cashflowModel.find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .skip(Number(skip))
        .select(select)
        .exec()
      console.log(transactions)
      return { transactions, openingBalance: previousTransaction?.balanceAfter }
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
