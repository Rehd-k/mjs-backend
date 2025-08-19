import { forwardRef, Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase, PurchaseSchema } from './purchases.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { SupplierModule } from 'src/supplier/supplier.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Purchase.name, schema: PurchaseSchema }]), SupplierModule, forwardRef(() => ProductModule)],
  providers: [PurchasesService],
  controllers: [PurchasesController],
  exports: [PurchasesService, MongooseModule]
})
export class PurchasesModule { }
