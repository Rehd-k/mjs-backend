import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar, Role.Supervisor, Role.Accounting)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('charges')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) { }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Post()
  create(@Body() createChargeDto: CreateChargeDto, @Req() req: any) {
    try {
      return this.chargesService.create(createChargeDto, req);
    } catch (error) {

      throw new Error(`Error creating charge, ${error}`);
    }

  }
  @Roles(Role.God, Role.Admin, Role.Manager, Role.Bar, Role.Waiter)
  @Get()
  findAll(
    @Req() req: any
  ) {
    try {
      return this.chargesService.findAll(req);
    } catch (error) {

      throw new Error(`Error getting charges, ${error}`);
    }

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.chargesService.findOne(id);
    } catch (error) {

      throw new Error(`Error getting charge, ${error}`);

    }

  }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChargeDto: UpdateChargeDto) {
    try {
      return this.chargesService.update(id, updateChargeDto);
    } catch (error) {

      throw new Error(`Error updating charge, ${error}`);

    }

  }

  @Roles(Role.God, Role.Admin, Role.Manager)
  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.chargesService.remove(id);
    } catch (error) {

      throw new Error(`Error deleting charge, ${error}`);

    }

  }
}
