import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, InternalServerErrorException } from '@nestjs/common';
import { ServingSizeService } from './serving-size.service';
import { CreateServingSizeDto } from './dto/create-serving-size.dto';
import { UpdateServingSizeDto } from './dto/update-serving-size.dto';
import { Role } from 'src/helpers/enums';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { RolesGuard } from 'src/helpers/roles/roles.guard';
import { QueryDto } from 'src/helpers/query.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Supervisor)
@Controller('servingsize')
export class ServingSizeController {
  constructor(private readonly servingSizeService: ServingSizeService) { }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.servingSizeService.create(body, req);
  }

  @Get()
  async findAll(
    @Query() query: QueryDto,
    @Req() req: any
  ) {
    try {
      const serving = await this.servingSizeService.findAll(query, req);

      return serving
    } catch (err) {
      throw new InternalServerErrorException(err);
    }

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servingSizeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServingSizeDto: UpdateServingSizeDto) {
    return this.servingSizeService.update(id, updateServingSizeDto);

  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servingSizeService.remove(id);
  }
}
