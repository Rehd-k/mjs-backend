import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/product/product.schema';
import { Sale, SaleSchema } from 'src/sales/sales.schema';
import { Supplier, SupplierSchema } from './supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: Product.name, schema: ProductSchema },
    ])
  ],
  providers: [SupplierService],
  controllers: [SupplierController],
  exports: [SupplierService]
})
export class SupplierModule { }
