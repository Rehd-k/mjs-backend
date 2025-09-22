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

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ min: 0, default: 0 })
    roq: number

    @Prop({ min: 0, default: 0 })
    quantity: number;

    @Prop({ trim: true })
    description: string;

    @Prop({ default: 'unit' })
    type: string;

    @Prop({ default: true })
    sellUnits: boolean;

    @Prop({ min: 0 })
    servingQuantity: number

    @Prop({ min: 0 })
    servingPrice: number

    @Prop({ trim: true, set: (title: string) => title.toLowerCase() })
    brand: string;

    @Prop({ trim: true, set: (title: string) => title.toLowerCase() })
    supplier: string;

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


    @Prop({ default: true, index: true }) // 🔹 Indexable for fast queries
    lowStock: boolean;

    @Prop({ required: true, default: 0 })
    initiator: String

    @Prop({ required: true, type: String })
    location: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre('save', function (next) {
  this.lowStock = this.quantity <= this.roq;
  next();
});