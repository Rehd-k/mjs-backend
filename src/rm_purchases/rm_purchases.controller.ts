import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { RmPurchasesService } from './rm_purchases.service';
import { CreateRmPurchaseDto } from './dto/create-rm_purchase.dto';
import { UpdateRmPurchaseDto } from './dto/update-rm_purchase.dto';
import { Role } from 'src/helpers/enums';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { RolesGuard } from 'src/helpers/roles/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager)
@Controller('rm-purchases')
export class RmPurchasesController {
  constructor(private readonly rmPurchasesService: RmPurchasesService) { }

  @Post()
  create(@Body() createRmPurchaseDto: CreateRmPurchaseDto, @Req() req: any) {
    return this.rmPurchasesService.create(createRmPurchaseDto, req);
  }

  @Get()
  findAll(
    @Query() query: any,
    @Req() req: any
  ) {
    return this.rmPurchasesService.findAll(query, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rmPurchasesService.findOne(id);
  }

  @Get('dashboard/:id')
  dashbaord(@Param('id') id: string) {
    return this.rmPurchasesService.getDashboardData(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRmPurchaseDto: UpdateRmPurchaseDto) {
    return this.rmPurchasesService.update(id, updateRmPurchaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rmPurchasesService.remove(id);
  }
}
