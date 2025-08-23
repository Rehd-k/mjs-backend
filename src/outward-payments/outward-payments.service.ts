import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOutwardPaymentDto } from './dto/create-outward-payment.dto';
import { UpdateOutwardPaymentDto } from './dto/update-outward-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { OutwardPayment } from './outward-payment.entity';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { QueryDto } from './query.dto';
import { Purchase } from 'src/purchases/purchases.schema';

@Injectable()
export class OutwardPaymentsService {
  constructor(
    @InjectModel(OutwardPayment.name) private readonly outwardPaymentModel: Model<OutwardPayment>,
    @InjectModel(Purchase.name) private readonly purchasesModel: Model<Purchase>
  ) { }

  async create(createOutwardPaymentDto: any, req: any) {

    try {
      createOutwardPaymentDto.location = req.user.location
      createOutwardPaymentDto.initiator = req.user.username

      const purchase = await this.purchasesModel.findById(createOutwardPaymentDto.paymentFor);
    
      if (!purchase) {
        throw new BadRequestException('Product not found');
      }

      purchase.debt = purchase.debt - createOutwardPaymentDto.amount;
      if (createOutwardPaymentDto.paymentMethod === 'cash') {
        purchase.cash = createOutwardPaymentDto.amount;
      }

      if (createOutwardPaymentDto.paymentMethod === 'transfer') {
        purchase.transfer = createOutwardPaymentDto.amount;
      }

      const  newPayment = new this.outwardPaymentModel(createOutwardPaymentDto)
      purchase.payments.push(newPayment._id)
      await purchase.save();
      return await newPayment.save()
    } catch (error) {
      errorLog(`Error creating Payment ${error}`, "ERROR")
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
      return this.outwardPaymentModel.find({ ...parsedFilter, location: req.user.location })
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
      return this.outwardPaymentModel.findById(id)
    } catch (error) {
      errorLog(`Error finding one Payments ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async update(id: number, updateOutwardPaymentDto: UpdateOutwardPaymentDto) {

    try {
      return this.outwardPaymentModel.findByIdAndUpdate(id, updateOutwardPaymentDto, { new: true }).exec();
    } catch (error) {
      errorLog(`Error updating one payment: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      return this.outwardPaymentModel.findByIdAndDelete(id).exec();
    } catch (error) {
      errorLog(`Error removing one Payment: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }
  }
}
