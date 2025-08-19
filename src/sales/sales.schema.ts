import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type SaleDocument = Sale & Document;

function generateTransactionId(): string {
    return Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}


function generateBarCodeId(): string {
    return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
}



@Schema()
class CartProduct {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    _id: Types.ObjectId;

    @Prop({
        set: (title: string) => title.toLowerCase()
    })
    title: string;

    @Prop()
    quantity: number;

    @Prop()
    price: number;

    @Prop([
        {
            quantity: Number,
            costPrice: Number,
            profit: Number,
            total_profit: Number,
            orderBatch: String
        },
    ])
    breakdown: Array<{ quantity: number; costPrice: number; profit: number, total_profit: number, orderBatch: string }>;


    @Prop()
    total: number;
}
const CartProductSchema = SchemaFactory.createForClass(CartProduct);

@Schema()
class Returns {
    @Prop()
    productId: string;

    @Prop({
        set: (title: string) => title.toLowerCase()
    })
    title: string;

    @Prop()
    quantity: number;

    @Prop()
    price: number;

    @Prop()
    total: number;

    @Prop(
        {
            set: (title: string) => title.toLowerCase()
        }
    )
    handler: string;

    @Prop({
        default: () => {
            // Create a date in GMT+1 (Central European Time)
            const now = new Date();
            // Get UTC time and add 1 hour (3600000 ms)
            return new Date(now.getTime() + 60 * 60 * 1000);
        }
    })
    returnedAt: Date;
}
const ReturnsSchema = SchemaFactory.createForClass(Returns);


@Schema()
class Charges {
    @Prop()
    title: string;

    @Prop()
    description: string;

    @Prop()
    amount: number;
}
const ChargesSchema = SchemaFactory.createForClass(Charges);



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
export class Sale {
    @Prop({ type: [CartProductSchema] })
    products: CartProduct[];

    @Prop({ default: generateTransactionId, index: 'text', set: (transactionId: string) => transactionId.toLowerCase(), })
    transactionId: string;
    @Prop({ default: generateBarCodeId, index: 'text', set: (generateBarCodeId: string) => generateBarCodeId.toLowerCase(), })
    barcodeId: string

    @Prop({ required: true })
    totalAmount: number;

    @Prop({
        set: (title: string) => title.toLowerCase(), index: 'text'
    })
    handler: string;

    @Prop({ required: true, enum: ['cash', 'card', 'transfer', 'mixed'] })
    paymentMethod: string;

    @Prop()
    cash: number;

    @Prop()
    card: number;

    @Prop()
    transfer: number;

    @Prop()
    discount: number;

    @Prop()
    profit: number;

    @Prop({ type: Types.ObjectId, ref: 'Bank' })
    bank: Types.ObjectId;

    @Prop({ type: [ReturnsSchema] })
    returns: Returns[]

    @Prop({ type: Types.ObjectId, ref: 'Customer' })
    customer: Types.ObjectId;

    @Prop({
        required: true,
        set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    transactionDate: Date;

    @Prop({ default: false })
    partPayment: boolean

    @Prop({ default: '' })
    for: string

    @Prop({ required: true, type: String })
    location: string;

    @Prop({ type: [ChargesSchema] })
    charges: Charges[];

}

export const SaleSchema = SchemaFactory.createForClass(Sale);