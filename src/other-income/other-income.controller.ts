import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Roles } from 'src/helpers/role/roles.decorator';
import { Role } from 'src/helpers/enums';
import { QueryDto } from 'src/product/query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { OtherIncomeService } from './other-income.service';
import { OtherIncomeCategoryService } from './other-income..service';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor, Role.Accounting)
@Controller('expense')
export class OtherIncomeController {
  constructor(private readonly otherIncomeService: OtherIncomeService, private readonly otherIncomeCategoryService: OtherIncomeCategoryService) { }


  @Post()
  async createOtherIncome(@Body() body: any, @Req() req: any) {

    return this.otherIncomeService.createotherIncome(body, req);

  }

  @Patch(':id')
  async updateOtherIncome(@Param('id') id: string, @Body() body: any) {
    return this.otherIncomeService.updateotherIncome(id, body);
  }

  @Delete(':id')
  async deleteOtherIncome(@Param('id') id: string) {
    return this.otherIncomeService.deleteotherIncome(id);
  }

  @Get()
  async getOtherIncome(@Query() query: QueryDto, @Req() req: any) {
    return this.otherIncomeService.getOtherIncome(query, req);
  }

  @Get('/total')
  async getTotalOtherIncome(@Query() query: QueryDto, @Req() req: any) {
    return this.otherIncomeService.getTotalOtherIncome(query, req);
  }

  @Get('/chart')
  async getOtherIncomeChart(@Query() query: QueryDto, @Req() req: any) {
    const filterOption = query.filter ?? "Today";
    return this.otherIncomeService.getotherIncomeData(filterOption, req);
  }



  @Post('/category')
  async createOtherIncomeCategory(@Body() body: any, @Req() req: any) {
    return this.otherIncomeCategoryService.create(body, req);
  }

  @Patch('/category/update/:id')
  async updateExpensCategory(@Param('id') id: string, @Body() body: any) {
    return this.otherIncomeCategoryService.update(id, body);
  }

  @Delete('/category/delete/:id')
  async deleteOtherIncomeCategory(@Param('id') id: string) {
    return this.otherIncomeCategoryService.delete(id);
  }

  @Get('/category')
  async getOtherIncomeCategories(@Req() req: any) {
    return this.otherIncomeCategoryService.findAll(req);
  }
}
