import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ReqisitionService } from './reqisition.service';

import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { CreateReqisitionDto } from './dto/create-reqisition.dto';
import { UpdateReqisitionDto } from './dto/update-reqisition.dto';

@Controller('reqisition')
@Roles(Role.God, Role.Admin, Role.Manager)
export class ReqisitionController {
  constructor(private readonly reqisitionService: ReqisitionService) { }

  @Post()
  create(@Body() createReqisitionDto: CreateReqisitionDto, @Req() req: any) {
    try {
      return this.reqisitionService.create(createReqisitionDto, req);
    } catch (error) {

      throw new Error(`Error creating reqisition, ${error}`);
    }

  }

  @Get()
  findAll(
    @Req() req: any
  ) {
    try {
      return this.reqisitionService.findAll(req);
    } catch (error) {

      throw new Error(`Error getting reqisitions, ${error}`);
    }

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.reqisitionService.findOne(id);
    } catch (error) {

      throw new Error(`Error getting reqisition, ${error}`);

    }

  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReqisitionDto: UpdateReqisitionDto) {
    try {
      return this.reqisitionService.update(id, updateReqisitionDto);
    } catch (error) {

      throw new Error(`Error updating reqisition, ${error}`);

    }

  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.reqisitionService.remove(id);
    } catch (error) {

      throw new Error(`Error deleting reqisition, ${error}`);

    }

  }
}
