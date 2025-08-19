import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

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
export class User {
    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true, minlength: 6 })
    password: string;

    @Prop({ required: true, enum: ['admin', 'manager', 'cashier', 'staff', 'god'], default: 'staff' })
    role: string;

    @Prop({ required: true })
    initiator: string;

    @Prop({ required: true, type: String })
    location: string;

}

export const UserSchema = SchemaFactory.createForClass(User);