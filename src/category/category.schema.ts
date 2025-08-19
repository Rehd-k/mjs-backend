import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

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
export class Category extends Document {

    @Prop({
        type: String,
        required: true,
        trim: true,
        set: (title: string) => title.toLowerCase()
    })
    title: string;

    @Prop({
        type: String,
        trim: true,
        set: (title: string) => title.toLowerCase()
    })
    description: string;

    @Prop({
        type: String,
        trim: true
    })
    user: string;

    @Prop({ required: true, type: String })
    location: string;
};

export const CategorySchema = SchemaFactory.createForClass(Category);

