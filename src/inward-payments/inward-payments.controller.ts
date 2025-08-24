import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InwardPaymentsService } from './inward-payments.service';
import { CreateInwardPaymentDto } from './dto/create-inward-payment.dto';
import { UpdateInwardPaymentDto } from './dto/update-inward-payment.dto';

@Controller('inward-payments')
export class InwardPaymentsController {
  constructor(private readonly inwardPaymentsService: InwardPaymentsService) {}

  @Post()
  create(@Body() createInwardPaymentDto: CreateInwardPaymentDto) {
    return this.inwardPaymentsService.create(createInwardPaymentDto);
  }

  @Get()
  findAll() {
    return this.inwardPaymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inwardPaymentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInwardPaymentDto: UpdateInwardPaymentDto) {
    return this.inwardPaymentsService.update(+id, updateInwardPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inwardPaymentsService.remove(+id);
  }
}
