import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    ) { }

    async createNotification(type: string, message: string, recipients: string[], req: any) {
        try {
            const notification = new this.notificationModel({ type, message, recipients, location: req.user.location });
            return await notification.save();
        } catch (error) {
            errorLog(error);
            throw new BadRequestException('Failed to create notification');
        }
    }

    async getNotifications(recipient: string, location: string) {
        try {
            return await this.notificationModel.find({ recipients: recipient, location }).sort({ createdAt: -1 });
        } catch (error) {
            errorLog(error);
            throw new BadRequestException('Failed to get notifications');
        }
    }

    async markAsRead(notificationId: string) {
        try {
            return await this.notificationModel.findByIdAndUpdate(notificationId, { isRead: true });
        } catch (error) {
            errorLog(error);
            throw new BadRequestException('Failed to mark notification as read');
        }
    }

}
