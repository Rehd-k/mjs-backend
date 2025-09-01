import { Module } from '@nestjs/common';
import { RmPurchasesService } from './rm_purchases.service';
import { RmPurchasesController } from './rm_purchases.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RmPurchase, RmPurchaseSchema } from './rm_purchase.entity';
import { CashflowModule } from 'src/cashflow/cashflow.module';
import { DepartmentModule } from 'src/department/department.module';
import { SupplierModule } from 'src/supplier/supplier.module';
import { RawMaterialModule } from 'src/raw-material/raw-material.module';

@Module({
  imports: [
    DepartmentModule,
    CashflowModule,
    SupplierModule,
    RawMaterialModule,
    MongooseModule.forFeature([{ name: RmPurchase.name, schema: RmPurchaseSchema }]),
  ],
  controllers: [RmPurchasesController],
  providers: [RmPurchasesService],
})
export class RmPurchasesModule { }
