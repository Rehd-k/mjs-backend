import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";

export type StoreDocument = Store & Document;

class Product {
    @Prop()
    title: string;

    @Prop({ type: { type: mongoose.Types.ObjectId }, ref: 'Product' })
    product: Types.ObjectId;

    @Prop()
    quantity: number;

    @Prop({ required: true, min: 0 })
    price: number;
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
export class Store {
    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    title: string;

    @Prop()
    description: string;

    @Prop({ type: [String], default: ['god', 'admin'] })
    access: string[]

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    initiator: string;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    type: string

    @Prop({ required: true, default: true })
    active: boolean

    @Prop()
    location: string;

    @Prop({
        type: [{
            title: String,
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
            price: Number,
        }]
    })
    products: Product[];
}

export const StoreSchema = SchemaFactory.createForClass(Store);
