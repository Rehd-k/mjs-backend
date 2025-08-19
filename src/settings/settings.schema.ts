import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
    @Prop({ required: true, unique: true })
    key: string;

    @Prop({ required: true })
    value: string;

    @Prop({ required: true })
    firm_name: string;

    @Prop({ required: true, type: String })
    location: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);