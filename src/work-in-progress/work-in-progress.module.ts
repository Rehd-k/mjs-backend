import { Module } from '@nestjs/common';
import { WorkInProgressService } from './work-in-progress.service';
import { WorkInProgressController } from './work-in-progress.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkInProgress, WorkInProgressSchema } from './work-in-progress.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: WorkInProgress.name, schema: WorkInProgressSchema }]),],
  controllers: [WorkInProgressController],
  providers: [WorkInProgressService],
})
export class WorkInProgressModule { }
