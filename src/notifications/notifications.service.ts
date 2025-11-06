import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';
import { errorLog } from 'src/helpers/do_loggers';
import { UserService } from 'src/user/user.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
        private readonly userService: UserService,
        private readonly firebaseService: FirebaseService,
        private readonly notificationGateway: NotificationGateway
    ) { }

    async createNotificationForRoles(message: string, recipients: string[], title: string, req: any) {
        try {
            let usernames: string[] = [];
            const notification = new this.notificationModel({ title, message, recipients, location: req.user.location });
            const nofit = await notification.save();
            for (const element of recipients) {
                const usersWithRoles = await this.userService.getUsersByRole(element, req)
                for (const element of usersWithRoles) {
                    await this.firebaseService.sendToUser(element._id.toString(), title, message, element.fcmToken)
                    usernames.push(element.username)
                }

                await this.notificationGateway.handleNotification({
                    to: usernames,
                    title,
                    message
                })
            }
            return nofit;
        } catch (error) {
            errorLog(error, req.url);
            throw new BadRequestException('Failed to create notification');
        }
    }


    async createNotificationForSpecificUser(title: string, message: string, recipient: string, req: any) {
        try {
            const notification = new this.notificationModel({ title, message, recipient, location: req.user.location });
            const nofit = await notification.save();
            const user = await this.userService.findOneByUsername(recipient)

            if (user) {
                await this.firebaseService.sendToUser(user._id.toString(), title, message, user.fcmToken)
                await this.notificationGateway.handleNotification({
                    to: [recipient],
                    title,
                    message
                })
            }


            return nofit;

        } catch (error) {
            errorLog(error, req.url);
            throw new BadRequestException('Failed to create notification');
        }
    }


    async getNotifications(recipient: string, location: string) {
        try {
            return await this.notificationModel.find({ recipients: recipient, location }).sort({ createdAt: -1 });
        } catch (error) {
            // errorLog(error, req);
            throw new BadRequestException('Failed to get notifications');
        }
    }

    async markAsRead(notificationId: string) {
        try {
            return await this.notificationModel.findByIdAndUpdate(notificationId, { isRead: true });
        } catch (error) {
            // errorLog(error);
            throw new BadRequestException('Failed to mark notification as read');
        }
    }

}
