import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
export type WorkInProgressDocument = WorkInProgress & Document;

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
class RawGoods {
    @Prop()
    title: string;

    @Prop({ type: Types.ObjectId, ref: 'RawMaterial' })
    productId: Types.ObjectId;

    @Prop({ default: 0 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    cost: number;

    @Prop()
    unit: string;

    @Prop()
    unitCost: number;
}
const RawGoodsSchema = SchemaFactory.createForClass(RawGoods);




@Schema({
    timestamps: {
        currentTime: () => {
            const now = new Date();
            return new Date(now.getTime() + 60 * 60 * 1000);
        }
    }
})
export class WorkInProgress {
    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    title: string


    @Prop()
    at: string;

    @Prop({ type: [RawGoodsSchema], default: [] })
    rawGoods: RawGoods[]

    @Prop({
        type: [{
            title: String,
            cost: Number
        }]
    })

    otherCosts: {
        title: string;
        cost: number;
    }[]
    @Prop({ required: true, type: String })
    location: string;

    @Prop({ required: true, type: Number, default: 0 })
    totalCost: number;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    initiator: string;


}

export const WorkInProgressSchema = SchemaFactory.createForClass(WorkInProgress);
