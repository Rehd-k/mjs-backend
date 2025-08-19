import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Purchase } from 'src/purchases/purchases.schema';

export type ProductDocument = Product & Document;

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
export class Product extends Document {
    @Prop({ required: true, trim: true, set: (title: string) => title.toLowerCase() })
    title: string;

    @Prop({ required: true, trim: true, set: (title: string) => title.toLowerCase() })
    category: string;

    @Prop({ min: 0, default: 0 })
    purchasePrice: number;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ type: [{ type: mongoose.Types.ObjectId }], ref: 'Purchase' })
    purchases: mongoose.Types.ObjectId[];

    @Prop({ type: [{ type: mongoose.Types.ObjectId }], ref: 'Transfers' })
    transfers: mongoose.Types.ObjectId[];

    @Prop({ min: 0, default: 0 })
    roq: number

    @Prop({ min: 0, default: 0 })
    quantity: number;

    @Prop({ trim: true })
    description: string;

    @Prop({ default: 'unit', enum: ['unit', 'carton', 'portion', 'kg', 'crate'] })
    type: String;

    @Prop({ required: true, min: 0 })
    cartonAmount: number

    @Prop({ required: true, min: 0 })
    cartonPrice: number

    @Prop({ trim: true, set: (title: string) => title.toLowerCase() })
    brand: string;

    @Prop({ trim: true, set: (title: string) => title.toLowerCase() })
    supplier: string;

    @Prop({
        set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    expiryDate: Date;

    @Prop({ min: 0, default: 0 })
    weight: number;

    @Prop({ enum: ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'unit', ''] })
    unit: string;

    @Prop({ default: generateTransactionId() })
    barcode: string;

    @Prop({ trim: true })
    imageUrl: string;

    @Prop({ default: false })
    isAvailable: boolean;

    @Prop({ default: 0 })
    sold: number;

    @Prop({ required: true, default: 0 })
    initiator: String

    @Prop({ required: true, type: String })
    location: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);