import { forwardRef, Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product, ProductSchema } from './product.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Sale, SaleSchema } from 'src/sales/sales.schema';
import { PurchasesModule } from 'src/purchases/purchases.module';
import { SalesModule } from 'src/sales/sales.module';
import { DepartmentModule } from 'src/department/department.module';
import { StockFlowModule } from 'src/stock-flow/stock-flow.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
    NotificationsModule,
    DepartmentModule,
    StockFlowModule,
    forwardRef(() => PurchasesModule),
    forwardRef(() => SalesModule)
  ],
  providers: [ProductService, InventoryService],
  controllers: [ProductController],
  exports: [ProductService, InventoryService]
})
export class ProductModule { }
