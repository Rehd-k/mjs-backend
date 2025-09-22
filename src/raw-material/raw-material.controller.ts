import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { RawMaterialService } from './raw-material.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { QueryDto } from 'src/helpers/query.dto';
import { RolesGuard } from 'src/helpers/roles/roles.guard';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
@Controller('rawmaterial')
export class RawMaterialController {
  constructor(private readonly rawMaterialService: RawMaterialService) { }


  @Post()
  create(@Body() createRawMaterialDto: CreateRawMaterialDto, @Req() req: any) {
    return this.rawMaterialService.create(createRawMaterialDto, req);
  }

  @Get()
  findAll(
    @Query() query: QueryDto,
    @Req() req: any
  ) {
    return this.rawMaterialService.findAll(query, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rawMaterialService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRawMaterialDto: UpdateRawMaterialDto) {
    return this.rawMaterialService.update(id, updateRawMaterialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rawMaterialService.remove(id);
  }
}
