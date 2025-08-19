import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TodoDocument = Todo & Document;

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
export class Todo extends Document {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    from: string;

    @Prop()
    for: string;

    @Prop({
        type: Date,
        default: () => {
            const now = new Date();
            now.setHours(24, 59, 59, 999); // Set to the end of the day
            return now;
        },
        set: (value: Date | string) => {
            const date = new Date(value);
            // Convert to GMT+1 by adding 1 hour (3600000 ms)
            return new Date(date.getTime() + 60 * 60 * 1000);
        }
    })
    maxDate: Date;

    @Prop({ default: false })
    isCompleted: boolean;

    @Prop({ required: true, type: String })
    location: string;

}

export const TodoSchema = SchemaFactory.createForClass(Todo);
