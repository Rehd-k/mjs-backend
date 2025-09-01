import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StockTrackerService } from './stock-tracker.service';
import { CreateStockTrackerDto } from './dto/create-stock-tracker.dto';
import { UpdateStockTrackerDto } from './dto/update-stock-tracker.dto';

@Controller('stock-tracker')
export class StockTrackerController {
  constructor(private readonly stockTrackerService: StockTrackerService) {}

  @Post()
  create(@Body() createStockTrackerDto: CreateStockTrackerDto) {
    return this.stockTrackerService.create(createStockTrackerDto);
  }

  @Get()
  findAll() {
    return this.stockTrackerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockTrackerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStockTrackerDto: UpdateStockTrackerDto) {
    return this.stockTrackerService.update(+id, updateStockTrackerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockTrackerService.remove(+id);
  }
}
