import { Injectable } from '@nestjs/common';
import { CreateInwardPaymentDto } from './dto/create-inward-payment.dto';
import { UpdateInwardPaymentDto } from './dto/update-inward-payment.dto';

@Injectable()
export class InwardPaymentsService {
  create(createInwardPaymentDto: CreateInwardPaymentDto) {
    return 'This action adds a new inwardPayment';
  }

  findAll() {
    return `This action returns all inwardPayments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inwardPayment`;
  }

  update(id: number, updateInwardPaymentDto: UpdateInwardPaymentDto) {
    return `This action updates a #${id} inwardPayment`;
  }

  remove(id: number) {
    return `This action removes a #${id} inwardPayment`;
  }
}
