import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { OutwardPaymentsService } from './outward-payments.service';
import { CreateOutwardPaymentDto } from './dto/create-outward-payment.dto';
import { UpdateOutwardPaymentDto } from './dto/update-outward-payment.dto';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { QueryDto } from './query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { RolesGuard } from 'src/helpers/roles/roles.guard';

@Controller('outward-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
export class OutwardPaymentsController {
  constructor(private readonly outwardPaymentsService: OutwardPaymentsService) { }


  @Post()
  create(@Body() createOutwardPaymentDto: CreateOutwardPaymentDto, @Req() req: any) {
    return this.outwardPaymentsService.create(createOutwardPaymentDto, req);
  }


  @Get()
  findAll(
    @Query() query: QueryDto,
    @Req() req: any
  ) {
    return this.outwardPaymentsService.findAll(query, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.outwardPaymentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOutwardPaymentDto: UpdateOutwardPaymentDto) {
    return this.outwardPaymentsService.update(+id, updateOutwardPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.outwardPaymentsService.remove(id);
  }
}
