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
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) { }

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
