import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from 'mongoose';
export type CashflowDocument = Cashflow & Document;

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
export class Cashflow {
    @Prop({ required: true, type: String })
    title: string;

    @Prop({ required: true, type: String })
    paymentFor: string;

    @Prop({ default: 0, type: Number })
    cash: number;

    @Prop({ default: 0, type: Number })
    bank: number;

    @Prop()
    initiator: string;
    @Prop()
    location: string;

    @Prop({ type: String })
    moneyFrom: string;

    @Prop({ required: true, type: String, enum: ['in', 'out'] })
    type: string;

    @Prop({ default: 0, type: Number })
    CashBalanceAfter: number;

    @Prop({ default: 0, type: Number })
    BankBalanceAfter: number

    @Prop({
        required: true,
        set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    transactionDate: Date;
}

export const CashflowSchema = SchemaFactory.createForClass(Cashflow);
