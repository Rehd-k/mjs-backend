import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";

export type StoreDocument = Store & Document;


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
class Product {
    @Prop()
    title: string;

    @Prop({ type: [{ type: mongoose.Types.ObjectId }], ref: 'Product' })
    products: Types.ObjectId[];

    @Prop()
    amount: number;
}
const ProductSchema = SchemaFactory.createForClass(Product);




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
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    initiator: string;

    @Prop({ required: true, default: true })
    active: boolean

    @Prop()
    location: string;

    @Prop({ type: [ProductSchema] })
    products: Product[];
}

export const StoreSchema = SchemaFactory.createForClass(Store);
