import { Module } from '@nestjs/common';
import { StockSnapshotService } from './stock-snapshot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StockSnapshot, StockSnapshotSchema } from './stock-snapshot.entity';
import { DepartmentModule } from 'src/department/department.module';
import { StockSnapshotController } from './stock-snapshot.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockSnapshot.name, schema: StockSnapshotSchema }
    ]),
    DepartmentModule
  ],
  providers: [StockSnapshotService],
  controllers: [StockSnapshotController],
})
export class StockSnapshotModule { }
