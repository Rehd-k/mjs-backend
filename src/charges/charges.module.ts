import { Module } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { ChargesController } from './charges.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Charge, ChargeSchema } from './entities/charge.entity';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Charge.name, schema: ChargeSchema }
  ])],
  controllers: [ChargesController],
  providers: [ChargesService],
})
export class ChargesModule { }
