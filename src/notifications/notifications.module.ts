import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './notification.schema';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { UserModule } from 'src/user/user.module';
// import { NotificationsGateway } from './notifications.gateway';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    FirebaseModule,
    UserModule
  ],

  providers: [NotificationsService,  NotificationGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule { }
