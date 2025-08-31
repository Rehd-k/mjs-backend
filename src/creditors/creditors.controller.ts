import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreditorsService } from './creditors.service';
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from './dto/update-creditor.dto';

@Controller('creditors')
export class CreditorsController {
  constructor(private readonly creditorsService: CreditorsService) {}

  @Post()
  create(@Body() createCreditorDto: CreateCreditorDto) {
    return this.creditorsService.create(createCreditorDto);
  }

  @Get()
  findAll() {
    return this.creditorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreditorDto: UpdateCreditorDto) {
    return this.creditorsService.update(+id, updateCreditorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditorsService.remove(+id);
  }
}
