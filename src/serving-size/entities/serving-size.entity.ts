import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
export type ServingSizeDocument = ServingSize & Document;

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
export class ServingSize {
    @Prop({ set: (title: string) => title.toLowerCase(), trim: true })
    title: string;

    @Prop({ set: (title: string) => title.toLowerCase(), trim: true })
    shortHand: string;

    @Prop({
        type: String,
        trim: true
    })
    initiator: string;

    @Prop({ required: true, type: String })
    location: string;
}

export const ServingSizeSchema = SchemaFactory.createForClass(ServingSize);
