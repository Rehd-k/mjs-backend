import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuthDocument = Auth & Document;

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
export class Auth {
    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true, minlength: 6 })
    password: string;

    @Prop({ required: true, enum: ['admin', 'manager', 'supervisor', 'staff', 'accounting', 'god', 'kitchen', 'bar', 'resturant'], default: 'staff' })
    role: string;

    @Prop({ required: true })
    initiator: string;

    @Prop({ required: true, enum: ['kitchen', 'restaurant', 'bar', 'pasties'] })
    department: string;

    @Prop({ required: true })
    location: string;

    @Prop({ required: true, type: [String] })
    access: string[]

}

export const AuthSchema = SchemaFactory.createForClass(Auth);