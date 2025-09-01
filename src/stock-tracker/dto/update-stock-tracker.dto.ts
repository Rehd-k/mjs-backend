import { PartialType } from '@nestjs/mapped-types';
import { CreateStockTrackerDto } from './create-stock-tracker.dto';

export class UpdateStockTrackerDto extends PartialType(CreateStockTrackerDto) {}
