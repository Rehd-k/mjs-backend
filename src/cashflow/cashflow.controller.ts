import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { CashflowService } from './cashflow.service';
import { CreateCashflowDto } from './dto/create-cashflow.dto';
import { UpdateCashflowDto } from './dto/update-cashflow.dto';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { QueryDto } from './query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { RolesGuard } from 'src/helpers/roles/roles.guard';

@Controller('cashflow')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar, Role.Supervisor, Role.Accounting)
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) { }

  @Post()
  createTransaction(
    @Body() body: any,
    @Req() req: any
  ) {

    let title = body.title;
    let paymentFor = body.paymentFor;
    let cash = Number(body.cash);
    let bank = Number(body.bank);
    let type = body.type;
    let moneyFrom = body.moneyFrom;
    let transactionDate = body.transactionDate;
    let initiator = req.user.username;
    let location = req.user.location
    return this.cashflowService.createPayment(title, paymentFor, cash, bank, type, moneyFrom, transactionDate, initiator, location)
  }

  @Get()
  findAll(
    @Query() query: QueryDto,
    @Req() req: any
  ) {
    return this.cashflowService.findAll(query, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashflowService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCashflowDto: UpdateCashflowDto) {
    return this.cashflowService.update(+id, updateCashflowDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cashflowService.remove(id);
  }
}
