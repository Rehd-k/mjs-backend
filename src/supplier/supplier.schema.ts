import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

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
export class Supplier extends Document {
    @Prop({ required: true })
    name: string;

    @Prop()
    email: string;

    @Prop()
    contactPerson: string;

    @Prop()
    phone_number: string;

    @Prop()
    address: string;

    @Prop()
    note: string;

    @Prop({ default: 0, type: Number })
    amountSpent: number;

    @Prop({ default: 'active' })
    status: string;

    @Prop({
        type: [{
            name: String,
            email: String,
            phone_number: String,
            role: String
        }]
    })
    otherContacts: {
        name: string,
        email: string,
        phone_number: string,
        role: string
    }[]

    @Prop({ type: [{ type: mongoose.Types.ObjectId }], ref: 'Purchase' })
    orders: Types.ObjectId[];

    @Prop()
    associatedProducts: [];

    @Prop({ type: [{ type: mongoose.Types.ObjectId }], ref: 'Cashflow' })
    payments: mongoose.Types.ObjectId[];

    @Prop({ required: true })
    initiator: string;

    @Prop({ required: true, type: String })
    location: string;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
