import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({
    timestamps: {
        currentTime: () => {
            // Create a date in GMT+1 (Central European Time)
            const now = new Date();
            // Get UTC time and add 1 hour (3600000 ms)
            return new Date(now.getTime() + 60 * 60 * 1000);
        }
    }
})
export class Notification extends Document {
    @Prop({ type: String, required: true })
    type: string; // e.g., "LowStock", "SalesAlert", "Promotion", 'General'

    @Prop({ type: String, required: true, set: (title: string) => title.toLowerCase() })
    message: string;

    @Prop({ type: [String], required: true })
    recipients: string[]; // e.g., Admins, Customers, Suppliers

    @Prop({ type: [String] })
    isRead: string[];

    @Prop({ required: true, type: String })
    location: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
