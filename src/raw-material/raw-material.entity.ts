import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

function generateTransactionId(): string {
    return Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

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
export class RawMaterial {
    @Prop({ required: true, trim: true, set: (title: string) => title.toLowerCase() })
    title: string;

    @Prop({ required: true, trim: true, set: (title: string) => title.toLowerCase() })
    category: string;

    @Prop({ default: 1 })
    servingSize: number;

    @Prop({ min: 0, default: 0 })
    roq: number;

    @Prop({ min: 0, default: 0 })
    quantity: number;

    @Prop()
    unit: string;

    @Prop({ trim: true })
    description: string;

    @Prop({ default: generateTransactionId() })
    barcode: string;


    @Prop({ type: [{ type: mongoose.Types.ObjectId }], ref: 'Cashflow' })
    payments: mongoose.Types.ObjectId[];

    @Prop({
        type: [{
            date: Date,
            quantity: Number,
            reason: String,
        }]
    })
    damagedGoods: {
        date: Date;
        quantity: number;
        reason: string;
    }[];


    @Prop({
        type: [{
            date: Date,
            quantity: Number,
            reason: String,
        }]
    })
    returns: {
        date: Date;
        quantity: number;
        reason: string;
    }[];


    @Prop({
        type: [{
            amount: Number,
            price: Number
        }]
    })
    sold: {
        amount: number;
        price: number;

    }[]

    @Prop({ required: true, default: 0 })
    initiator: String

    @Prop({ required: true, type: String })
    location: string;
}

export const RawMaterialSchema = SchemaFactory.createForClass(RawMaterial);
