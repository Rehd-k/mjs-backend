import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './customer.schema';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
    ActivityModule
  ],
  providers: [CustomerService],
  controllers: [CustomerController],
  exports: [CustomerService, MongooseModule]
})
export class CustomerModule { }
