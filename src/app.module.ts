import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { activitiesLog } from './helpers/do_loggers';
import { BankModule } from './bank/bank.module';
import { ActivityModule } from './activity/activity.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CategoryModule } from './category/category.module';
import { ChargesModule } from './charges/charges.module';
import { CustomerModule } from './customer/customer.module';
import { ExpenseModule } from './expense/expense.module';
import { InvoiceModule } from './invoice/invoice.module';
import { LocationModule } from './location/location.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProductModule } from './product/product.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SalesModule } from './sales/sales.module';
import { SettingsModule } from './settings/settings.module';
import { SupplierModule } from './supplier/supplier.module';
import { TodoModule } from './todo/todo.module';
import { UserModule } from './user/user.module';
import * as fs from 'fs';
import { LoggerModule } from 'nestjs-pino';
import { OutwardPaymentsModule } from './outward-payments/outward-payments.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProductModule,
    SalesModule,
    SupplierModule,
    AnalyticsModule,
    NotificationsModule,
    ActivityModule,
    ExpenseModule,
    LocationModule,
    PurchasesModule,
    CategoryModule,
    CustomerModule,
    TodoModule,
    InvoiceModule,
    SettingsModule,
    ChargesModule,
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const uri = process.env.DATABASE_PROD;
        return {
          uri,
          connectionFactory: (connection) => {
            connection.once('open', () => {
              activitiesLog('DB started');
            });
            return connection;
          },
        };
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: process.env.NODE_ENV === 'production'
        ? {
          level: 'info',
          timestamp: () => `,"time":"${new Date()}"`,
          stream: fs.createWriteStream('./logs/activities.log', { flags: 'a' }),
        }
        : {
          level: 'debug',
          transport: {
            target: 'pino-pretty',
          },
        },
    }),
    BankModule,
    OutwardPaymentsModule,
    StoreModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
