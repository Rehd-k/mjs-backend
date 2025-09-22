import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { StockFlowService } from './stock-flow.service';
import { CreateStockFlowDto } from './dto/create-stock-flow.dto';
import { UpdateStockFlowDto } from './dto/update-stock-flow.dto';
import { Role } from 'src/helpers/enums';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { RolesGuard } from 'src/helpers/roles/roles.guard';
import { QueryDto } from 'src/helpers/query.dto';

@Controller('stock-flow')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Accounting)
export class StockFlowController {
  constructor(private readonly stockFlowService: StockFlowService) { }

  @Get()
  findAll(
    @Query() query: QueryDto,
    @Req() req: any
  ) {
    return this.stockFlowService.findAll(query, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockFlowService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStockFlowDto: UpdateStockFlowDto) {
    return this.stockFlowService.update(+id, updateStockFlowDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockFlowService.remove(id);
  }
}
