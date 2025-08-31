import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { RolesGuard } from 'src/helpers/roles/roles.guard';
import { Role } from 'src/helpers/enums';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { Roles } from 'src/helpers/roles/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) { }

  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req: any) {
    return this.departmentService.create(createDepartmentDto, req);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query() query: any
  ) {
    return this.departmentService.findAll(req, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.departmentService.findOne(id);
  }

  @Get('for-sell/:id')
  async findForSell(@Param('id') id: string, @Query() query: any) {
    return await this.departmentService.getProductsForSell(id, query);
  }

  @Post('move-stock')
  async moveStock(@Query() query: any, @Body('body') body: any) {

    return await this.departmentService.sendOrReceiveStock(query.senderId, query.receiverId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepartmentDto: any, @Query() filter: any,) {
    return this.departmentService.update(id, updateDepartmentDto, filter);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
