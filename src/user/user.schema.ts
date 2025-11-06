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
    @Prop()
    profile_Photo: string;

    @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, default: null })
    customer: Types.ObjectId;

    @Prop({
        default: false
    })
    credit_sale: boolean

    @Prop()
    documentation_media: string[];

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ unique: true })
    email: string;

    @Prop()
    address: string;

    @Prop()
    gender: string;

    @Prop()
    DoB: Date;

    @Prop()
    nationality: string;

    @Prop()
    marital_status: string;

    @Prop()
    job_title: string;

    @Prop()
    department: string;

    @Prop()
    start_date: Date;

    @Prop()
    employment_type: string;

    @Prop()
    reporting_manager: string;

    @Prop()
    shift_schedule: String;

    @Prop()
    salary: number;

    @Prop()
    fcmToken: string;

    @Prop({ required: true, minlength: 6 })
    password: string;

    @Prop({ required: true, default : '' })
    phone_number: string;

    @Prop({ required: true, enum: ['admin', 'manager', 'cashier', 'staff', 'god', 'waiter', 'bar', 'supervisor', 'accountant', 'chef', 'store keeper'], default: 'staff' })
    role: string;

    @Prop({ required: true })
    initiator: string;

    @Prop({ required: true, type: String })
    location: string;




}

export const UserSchema = SchemaFactory.createForClass(User);