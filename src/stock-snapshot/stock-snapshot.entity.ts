
// StockSnapshot schema (new collection for daily snapshots)
// We'll store one document per department per day for easier querying and updates.
// This follows best practices: avoids large documents, allows efficient queries by date/department,

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { DepartmentProduct, DepartmentProductSchema, RawGoods, RawGoodsSchema } from "src/department/entities/department.entity";

// and makes it simple to update specific snapshots for backdated transactions.
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
export class StockSnapshot {
    @Prop({ required: true })
    date: Date; // The date of the snapshot (normalized to start of day)

    @Prop({ type: String, required: true })
    department: string;

    @Prop({ type: [DepartmentProductSchema], default: [] })
    finishedGoods: DepartmentProduct[];

    @Prop({ type: [RawGoodsSchema], default: [] })
    RawGoods: RawGoods[];
}

export const StockSnapshotSchema = SchemaFactory.createForClass(StockSnapshot);