import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
    @Prop({ required: true })
    firm_name: string;

    @Prop({ required: true, default: ['admin', 'manager', 'supervisor', 'staff', 'accounting', 'god', 'kitchen', 'bar', 'resturant', 'store'], type: [String] })
    roles: string[];

    @Prop({ type: String, required: true, set: (title: string) => title.toLowerCase() })
    initiatior: string;

    @Prop({ required: true, type: String })
    location: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);