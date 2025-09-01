import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { WorkInProgressService } from './work-in-progress.service';
import { CreateWorkInProgressDto } from './dto/create-work-in-progress.dto';
import { UpdateWorkInProgressDto } from './dto/update-work-in-progress.dto';
import { Role } from 'src/helpers/enums';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { RolesGuard } from 'src/helpers/roles/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager)
@Controller('work-in-progress')
export class WorkInProgressController {
  constructor(private readonly workInProgressService: WorkInProgressService) { }

  @Post()
  create(@Body() createWorkInProgressDto: CreateWorkInProgressDto, @Req() req: any) {
    return this.workInProgressService.create(createWorkInProgressDto, req);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query() query: any
  ) {
    return this.workInProgressService.findAll(query, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workInProgressService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkInProgressDto: UpdateWorkInProgressDto) {
    return this.workInProgressService.update(id, updateWorkInProgressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workInProgressService.remove(id);
  }
}
