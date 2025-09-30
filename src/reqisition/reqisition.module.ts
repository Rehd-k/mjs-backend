import { Module } from '@nestjs/common';
import { ReqisitionService } from './reqisition.service';
import { ReqisitionController } from './reqisition.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Reqisition, ReqisitionSchema } from './reqisition.entity';
import { DepartmentModule } from 'src/department/department.module';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Reqisition.name, schema: ReqisitionSchema }
  ]),
    DepartmentModule
  ],
  controllers: [ReqisitionController],
  providers: [ReqisitionService],
})
export class ReqisitionModule { }
