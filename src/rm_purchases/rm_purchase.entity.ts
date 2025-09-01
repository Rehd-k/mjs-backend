import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";

export type RmPurchaseDocument = RmPurchase & Document;

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
export class RmPurchase {


    @Prop({ type: Types.ObjectId, ref: 'RawMaterial', required: true })
    rawmaterialId: Types.ObjectId;

    @Prop({ required: true })
    quantity: number;

    // unit price (1 unit)
    @Prop({ required: true })
    cost: number;

    // unit price (1 unit)
    @Prop({ required: true })
    unitCost: number;


    @Prop({ required: true })
    total: number;

    @Prop({ required: true })
    totalPayable: number;

    @Prop({
        required: true, set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    purchaseDate: Date;

    @Prop({
        set: (title: string) => title.toLowerCase()
    })
    dropOfLocation: string;

    @Prop({
        set: (title: string) => title.toLowerCase()
    })
    notes: string;


    @Prop({ type: mongoose.Types.ObjectId, ref: 'Supplier' })
    supplier: Types.ObjectId;

    @Prop({
        default: new Date,
        set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    expiryDate: Date;

    @Prop({ default: 0 })
    cash: number;

    @Prop({ default: 0 })
    bank: number

    @Prop({ default: 0 })
    debt: number;

    @Prop({ default: 0 })
    discount: number;

    @Prop()
    moneyFrom: string

    @Prop()
    deliveryDate: Date;


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
            amount: Number,
            cost: Number
        }]
    })

    used: {
        amount: number;
        cost: number;

    }[]

    returns: {
        date: Date;
        quantity: number;
        reason: string;
    }[];

    @Prop({ required: true, type: String })
    location: string;
    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    initiator: string;

}
export const RmPurchaseSchema = SchemaFactory.createForClass(RmPurchase);
