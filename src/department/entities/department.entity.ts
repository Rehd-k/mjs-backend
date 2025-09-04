import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";

export type DepartmentDocument = Department & Document;

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
class DepartmentProduct {
    @Prop()
    title: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product' })
    productId: Types.ObjectId;

    @Prop({ default: 0 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop()
    type: string;

    @Prop({ default: 0 })
    servingSize: number;

    @Prop({ default: true })
    sellUnits: boolean;

    @Prop({ default: 0 })
    servingPrice: number;
}
const DepartmentProductSchema = SchemaFactory.createForClass(DepartmentProduct);



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

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' })
    productId: Types.ObjectId;

    @Prop({ default: 0 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    cost: number;

    @Prop({ required: true, min: 0 })
    unitCost: number;

    @Prop()
    unit: string;
}
const RawGoodsSchema = SchemaFactory.createForClass(RawGoods);


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
export class Department {
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

    @Prop({ type: [DepartmentProductSchema], default: [] })
    finishedGoods: DepartmentProduct[];

    @Prop({ type: [RawGoodsSchema], default: [] })
    RawGoods: RawGoods[]
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
