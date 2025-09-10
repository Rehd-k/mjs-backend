import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './invoice.schema';
import { ActivityModule } from 'src/activity/activity.module';
import { DepartmentModule } from 'src/department/department.module';
import { ProductModule } from 'src/product/product.module';
import { CustomerModule } from 'src/customer/customer.module';
import { StockFlowModule } from 'src/stock-flow/stock-flow.module';
import { CashflowModule } from 'src/cashflow/cashflow.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    ActivityModule,
    DepartmentModule,
    ProductModule,
    CustomerModule,
    CashflowModule,
    StockFlowModule
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],


  // WhatsappService


})
export class InvoiceModule { }
