import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { RolesGuard } from 'src/helpers/roles/roles.guard';
import { Role } from 'src/helpers/enums';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { Roles } from 'src/helpers/roles/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) { }

  @Post()
  create(@Body() createStoreDto: CreateStoreDto, @Req() req: any) {
    return this.storeService.create(createStoreDto, req);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query() query: any
  ) {
    return this.storeService.findAll(req, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.storeService.findOne(id);
  }

  @Post('move-stock')
  async moveStock(@Query() query: any, @Body('body') body: any) {
  
    return await this.storeService.sendOrReceiveStock(query.senderId, query.receiverId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: any, @Query() filter: any,) {
    return this.storeService.update(id, updateStoreDto, filter);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }
}
