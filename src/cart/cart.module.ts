import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './cart.entity'
import { NotificationsModule } from 'src/notifications/notifications.module';
import { DepartmentModule } from 'src/department/department.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
    NotificationsModule,
    UserModule
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule { }
