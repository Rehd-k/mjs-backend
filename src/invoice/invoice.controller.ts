import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query, Put } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryDto } from 'src/product/query.dto';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar, Role.Supervisor, Role.Accounting)
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }


  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req: any) {
    return this.invoiceService.create(createInvoiceDto, req);
  }


  @Get()
  findAll(
    @Query() query: QueryDto, @Req() req: any
  ) {
    return this.invoiceService.findAll(query, req);
  }


  @Get('customer')
  findAllForCustomer(
    @Query() query: QueryDto, @Req() req: any
  ) {
    return this.invoiceService.findAllCustomersInvoices(query, req);
  }

  @Get('customer/dashboard')
  findForCustomerDashbaord(
    @Query() query: QueryDto, @Req() req: any
  ) {
    return this.invoiceService.getCustomerDashBoardInfo(query, req);
  }


  @Get('/send-whatsapp/:id')
  sendMessage(
    @Param('id') id: string
  ) {
    return this.invoiceService.sendMessage(id);
  }

  @Get(':filter')
  findOne(@Param('filter') filter: string) {
    return this.invoiceService.findOne(filter);
  }

  @Put('update/:filter')
  update(@Param('filter') filter: string, @Body() updateInvoiceDto: UpdateInvoiceDto, @Req() req: any) {
    return this.invoiceService.update(filter, updateInvoiceDto, req);
  }

  @Delete(':filter')
  remove(@Param('filter') filter: string, @Req() req: any) {
    return this.invoiceService.remove(filter, req);
  }
}
