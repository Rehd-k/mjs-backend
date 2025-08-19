
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpensesDocument = Expenses & Document;

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
export class Expenses extends Document {
    @Prop({ type: String, required: true, set: (title: string) => title.toLowerCase() })
    category: string;

    @Prop({ type: String, set: (title: string) => title.toLowerCase() })
    description: string;

    @Prop({ type: Number, required: true })
    amount: number;

    @Prop({ type: Number, default: 0 })
    amountPaid: number

    @Prop({ type: String, required: true, set: (title: string) => title.toLowerCase() })
    createdBy: string;

    @Prop({ required: true, type: String })
    location: string;
}

export const ExpensesSchema = SchemaFactory.createForClass(Expenses);
