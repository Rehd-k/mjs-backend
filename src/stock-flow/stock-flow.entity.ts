import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from 'mongoose';
export type StockFlowDocument = StockFlow & Document;

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
export class StockFlow {
    @Prop({ required: true, type: String })
    title: string;

    @Prop({ required: true, type: String })
    product: string;

    @Prop({ default: 0, type: Number })
    quantity: number;

    @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
    stockFrom: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
    stockTo: string;

    @Prop({ required: true, type: String, enum: ['in', 'out', 'contra'] })
    type: string;

    @Prop({ default: 0, type: Number })
    stockBalanceAfter: number;

    @Prop({
        required: true,
        set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    transactionDate: Date;

    @Prop({ required: true })
    initiator: string;

    @Prop({ required: true })
    location: string;
}

export const StockFlowSchema = SchemaFactory.createForClass(StockFlow);
