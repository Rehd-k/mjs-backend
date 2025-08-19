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
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req: any) {
    return this.invoiceService.create(createInvoiceDto, req);
  }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Get()
  findAll(
    @Query() query: QueryDto, @Req() req: any
  ) {
    return this.invoiceService.findAll(query, req);
  }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Get('customer')
  findAllForCustomer(
    @Query() query: QueryDto, @Req() req: any
  ) {
    return this.invoiceService.findAllCustomersInvoices(query, req);
  }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Get('customer/dashboard')
  findForCustomerDashbaord(
    @Query() query: QueryDto, @Req() req: any
  ) {
    return this.invoiceService.getCustomerDashBoardInfo(query, req);
  }


  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Get('/send-whatsapp/:id')
  sendMessage(
    @Param('id') id: string
  ) {
    return this.invoiceService.sendMessage(id);
  }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Get(':filter')
  findOne(@Param('filter') filter: string) {
    return this.invoiceService.findOne(filter);
  }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Put('update/:filter')
  update(@Param('filter') filter: string, @Body() updateInvoiceDto: UpdateInvoiceDto, @Req() req: any) {
    return this.invoiceService.update(filter, updateInvoiceDto, req);
  }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
  @Delete(':filter')
  remove(@Param('filter') filter: string, @Req() req: any) {
    return this.invoiceService.remove(filter, req);
  }
}
