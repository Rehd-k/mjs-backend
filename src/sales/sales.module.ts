import { forwardRef, Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { ProductModule } from 'src/product/product.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from './sales.schema';
import { PurchasesModule } from 'src/purchases/purchases.module';
import { CustomerModule } from 'src/customer/customer.module';
import { ActivityModule } from 'src/activity/activity.module';
import { StockFlowModule } from 'src/stock-flow/stock-flow.module';
import { DepartmentModule } from 'src/department/department.module';
import { CashflowModule } from 'src/cashflow/cashflow.module';
@Module({
  imports: [
    forwardRef(() => ProductModule),
    CustomerModule,
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema }
    ]),
    StockFlowModule,
    PurchasesModule,
    ActivityModule,
    DepartmentModule,
    CashflowModule
  ],
  providers: [SalesService],
  controllers: [SalesController],
  exports: [SalesService]

  // WhatsappService
})
export class SalesModule { }
