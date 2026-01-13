import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar, Role.Supervisor, Role.Accounting, Role.Cashier)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) { }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Post()
  create(@Body() createDiscountDto: any, @Req() req: any) {
    try {
      return this.discountsService.create(createDiscountDto, req);
    } catch (error) {

      throw new Error(`Error creating discount, ${error}`);
    }

  }
  @Roles(Role.God, Role.Admin, Role.Manager, Role.Bar, Role.Waiter, Role.Cashier)
  @Get()
  findAll(
    @Req() req: any
  ) {
    try {
      return this.discountsService.findAll(req);
    } catch (error) {

      throw new Error(`Error getting discounts, ${error}`);
    }

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.discountsService.findOne(id);
    } catch (error) {

      throw new Error(`Error getting discount, ${error}`);

    }

  }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDiscountDto: any) {
    try {
      return this.discountsService.update(id, updateDiscountDto);
    } catch (error) {

      throw new Error(`Error updating discount, ${error}`);

    }

  }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.discountsService.remove(id);
    } catch (error) {

      throw new Error(`Error deleting discount, ${error}`);

    }

  }
}
