import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BankDocument = Bank & Document;

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
export class Bank {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    accountNumber: string;

    @Prop({ required: true, })
    accountName: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: 0 })
    balance: number;

    @Prop({ type: [String] })
    access: string[]

    @Prop({ type: Types.ObjectId, ref: 'InwardPayment' })
    inward: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'OutwardPayment' })
    outward: Types.ObjectId;

    @Prop({ required: true, type: String })
    location: string;

    @Prop({
        type: String,
        trim: true
    })
    initiator: string;
}

export const BankSchema = SchemaFactory.createForClass(Bank);