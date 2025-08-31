import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './entities/department.entity';
import { DepartmentHistory, DepartmentHistorySchema } from './entities/department.history.entity';
import { DepartmentHistoryService } from './department.history.service';
import { DepartmentHistortyController } from './history.controller';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Department.name, schema: DepartmentSchema },
    { name: DepartmentHistory.name, schema: DepartmentHistorySchema }
  ])],
  controllers: [DepartmentController, DepartmentHistortyController],
  providers: [DepartmentService, DepartmentHistoryService],
  exports: [MongooseModule]
})
export class DepartmentModule { }
