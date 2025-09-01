import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
export type WorkInProgressDocument = WorkInProgress & Document;

@Schema({
    timestamps: {
        currentTime: () => {
            const now = new Date();
            return new Date(now.getTime() + 60 * 60 * 1000);
        }
    }
})
export class WorkInProgress {
    @Prop()
    title: string

    @Prop({
        type: [{
            title: String,
            amount: Number,
            price: Number,
        }]
    })

    products: {
        title: string;
        amount: number;
        price: number;

    }[]

    @Prop({
        type: [{
            title: String,
            price: Number
        }]
    })

    otherCost: {
        title: string;
        price: number;
    }
}

export const WorkInProgressSchema = SchemaFactory.createForClass(WorkInProgress);
