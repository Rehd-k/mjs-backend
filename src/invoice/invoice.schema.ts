import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;


@Schema()
class CartProduct {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({
        set: (title: string) => title.toLowerCase()
    })
    title: string;

    @Prop()
    quantity: number;

    @Prop({ default: 0 })
    quantity_paid: number;

    @Prop()
    from: string;


    @Prop()
    price: number;

    @Prop()
    total: number;
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
export class Invoice extends Document {


    @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, default: null })
    customer: Types.ObjectId;

    @Prop({
        required: true, type: Date, set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    issuedDate: Date;

    @Prop({
        required: true, type: Date, set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    dueDate: Date;

    @Prop({ required: true, unique: true })
    invoiceNumber: string;

    @Prop({ type: [CartProduct] })
    items: CartProduct[];

    @Prop({ required: true, type: Number })
    discount: number;

    @Prop({ required: true, type: Number })
    totalAmount: number;

    @Prop({ required: true, type: Number })
    tax: number;

    @Prop({ required: true, type: Number })
    previouslyPaidAmount: number;

    @Prop({ default: 'unpaid', enum: ["unpaid", "partial", "paid"] })
    status: string;

    @Prop({ default: [String] })
    transactionId: string[];

    @Prop({ type: Types.ObjectId, ref: 'Bank', default: null })
    bank: Types.ObjectId;

    @Prop()
    note: string;

    @Prop()
    amountPaid: number;

    @Prop({ required: true, type: String })
    initiator: string;

    @Prop({ required: true, type: String })
    location: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);