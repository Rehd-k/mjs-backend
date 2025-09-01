import { Module } from '@nestjs/common';
import { RawMaterialService } from './raw-material.service';
import { RawMaterialController } from './raw-material.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RawMaterial, RawMaterialSchema } from './raw-material.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RawMaterial.name, schema: RawMaterialSchema }])],
  controllers: [RawMaterialController],
  providers: [RawMaterialService],
  exports: [MongooseModule, RawMaterialService]
})
export class RawMaterialModule { }
