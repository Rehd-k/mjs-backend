import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";

class Product {
    @Prop({ type: { type: mongoose.Types.ObjectId }, ref: 'Product' })
    product: Types.ObjectId;

    @Prop()
    quantity: number;
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
export class DepartmentHistory {
    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    from: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Department' })
    fromId: Types.ObjectId;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    to: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Department' })
    toId: Types.ObjectId;

    @Prop({
        type: [{
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
        }]
    })
    products: Product[];

    @Prop()
    section : string;

    @Prop()
    location: string;

    @Prop({ set: (title: string) => title.toLowerCase() })
    closer: string;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    initiator: string;
}


export const DepartmentHistorySchema = SchemaFactory.createForClass(DepartmentHistory);