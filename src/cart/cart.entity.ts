import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type CartDocument = Cart & Document;



@Schema({
    _id: false
})
class CartProduct {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({
        set: (title: string) => title.toLowerCase()
    })
    title: string;

    @Prop()
    quantity: number;

    @Prop()
    price: number;

    @Prop()
    from: string;

    @Prop()
    total: number;

    @Prop({
        default: false
    })
    settled: boolean
}
const CartProductSchema = SchemaFactory.createForClass(CartProduct);


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
export class Cart {
    @Prop({ type: [CartProductSchema] })
    products: CartProduct[];

    @Prop()
    location: string;

    @Prop()
    initiator: string;

    @Prop({
        default: false
    })
    settled: boolean
}
export const CartSchema = SchemaFactory.createForClass(Cart);

