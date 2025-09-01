import { Injectable } from '@nestjs/common';
import { CreateStockTrackerDto } from './dto/create-stock-tracker.dto';
import { UpdateStockTrackerDto } from './dto/update-stock-tracker.dto';

@Injectable()
export class StockTrackerService {
  create(createStockTrackerDto: CreateStockTrackerDto) {
    return 'This action adds a new stockTracker';
  }

  findAll() {
    return `This action returns all stockTracker`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stockTracker`;
  }

  update(id: number, updateStockTrackerDto: UpdateStockTrackerDto) {
    return `This action updates a #${id} stockTracker`;
  }

  remove(id: number) {
    return `This action removes a #${id} stockTracker`;
  }
}
