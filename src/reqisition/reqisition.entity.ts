import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type ReqisitionDocument = Reqisition & Document;

@Schema({
    _id: false,
    timestamps: {
        currentTime: () => {
            // Create a date in GMT+1 (Central European Time)
            const now = new Date();
            // Get UTC time and add 1 hour (3600000 ms)
            return new Date(now.getTime() + 60 * 60 * 1000);
        }
    },
})
export class ReqisitionProduct {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: String, required: true })
    product_title: string;

    @Prop({ default: 0, required: true })
    quantity: number;

    @Prop({ default: 0, required: true })
    cost: number
}
export const ReqisitionProductSchema = SchemaFactory.createForClass(ReqisitionProduct);


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
export class Reqisition {
    @Prop()
    notes: string;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    initiator: string;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    from: string

    @Prop({ type: Boolean, default: false })
    approved: boolean

    @Prop({ type: Number, default: 0 })
    totalCost: number

    @Prop()
    location: string;

    @Prop({ type: [ReqisitionProductSchema], default: [] })
    products: ReqisitionProduct[];
}
export const ReqisitionSchema = SchemaFactory.createForClass(Reqisition);

