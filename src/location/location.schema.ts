import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LocationDocument = Location & Document;

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
export class Location extends Document {
    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    firm_name: string;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    name: string;

    @Prop({ required: true, set: (title: string) => title.toLowerCase() })
    location: string;

    @Prop({ type: String, required: true })
    manager: string;

    @Prop()
    openingHours: string;

    @Prop()
    closingHours: string;

    @Prop()
    initiator: string;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
