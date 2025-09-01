import { forwardRef, Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase, PurchaseSchema } from './purchases.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { SupplierModule } from 'src/supplier/supplier.module';
import { ProductModule } from 'src/product/product.module';
import { DepartmentModule } from 'src/department/department.module';
import { CashflowModule } from 'src/cashflow/cashflow.module';

@Module({
  imports: [
    DepartmentModule,
    CashflowModule,
       SupplierModule,
    MongooseModule.forFeature([{ name: Purchase.name, schema: PurchaseSchema }]),
 
    forwardRef(() => ProductModule)
  ],
  providers: [PurchasesService],
  controllers: [PurchasesController],
  exports: [PurchasesService]
})
export class PurchasesModule { }
