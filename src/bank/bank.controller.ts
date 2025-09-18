import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { RolesGuard } from 'src/helpers/roles/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/roles/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) { }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Post()
  create(@Body() createBankDto: CreateBankDto, @Req() req: any) {
    return this.bankService.create(createBankDto, req);
  }


  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar)
  @Get()
  findAll(
    @Req() req: any
  ) {
    return this.bankService.findAll(req);
  }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankService.findOne(id);
  }

  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    return this.bankService.update(id, updateBankDto);
  }


  @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bankService.remove(id);
  }
}
