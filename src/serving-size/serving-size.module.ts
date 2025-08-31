import { Module } from '@nestjs/common';
import { ServingSizeService } from './serving-size.service';
import { ServingSizeController } from './serving-size.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ServingSize, ServingSizeSchema } from './entities/serving-size.entity';

@Module({
  imports: [MongooseModule.forFeature([
    { name: ServingSize.name, schema: ServingSizeSchema }
  ])],
  controllers: [ServingSizeController],
  providers: [ServingSizeService],
})
export class ServingSizeModule { }
