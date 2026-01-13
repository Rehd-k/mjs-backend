import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true })
export class Discount extends Document {
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    percentage: number;

    @Prop({ required: true, type: String })
    location: string;

    @Prop()
    initiator: string;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);
