import { PartialType } from '@nestjs/mapped-types';
import { CreateStockSnapshotDto } from './create-stock-snapshot.dto';

export class UpdateStockSnapshotDto extends PartialType(CreateStockSnapshotDto) {}
