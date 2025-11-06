// attendance.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({ required: true })
  userId: string; // or ObjectId if referencing a User model

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ enum: ['present', 'absent', 'late'], default: 'present' })
  status: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
