import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStockSnapshotDto } from './dto/create-stock-snapshot.dto';
import { UpdateStockSnapshotDto } from './dto/update-stock-snapshot.dto';
import { StockSnapshot } from './stock-snapshot.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { Department, DepartmentProduct, RawGoods } from 'src/department/entities/department.entity';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class StockSnapshotService {
  constructor(
    @InjectModel(StockSnapshot.name) private snapshotModel: Model<StockSnapshot>,// Assuming you have a transactions collection
    @InjectModel(Department.name) private departmentModel: Model<Department>,

  ) { }


  // Cron job to take daily snapshot at 11:59 PM.
  // This runs automatically every day.
  // It fetches all departments and creates a snapshot for each, copying the arrays.
  // Note: Array copies are shallow, but since these are simple objects, it's fine.
  // If you have nested complexity, consider deep cloning.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Africa/Lagos'
  }) // Actually runs at 00:00 next day, but represents previous day's close. Adjust to '59 23 * * *' if you want exactly 11:59 PM.
  async takeDailySnapshot(): Promise<void> {
    const departments = await this.departmentModel.find().exec();
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0); // Normalize to start of the day (representing previous day's close if run at midnight)

    for (const dept of departments) {
      // Check if snapshot already exists for this date/dept to avoid duplicates (idempotent)
      const existing = await this.snapshotModel.findOne({
        date: snapshotDate,
        department: dept.title,
      });
      if (existing) continue;

      await this.snapshotModel.create({
        date: snapshotDate,
        department: dept.title,
        finishedGoods: dept.finishedGoods,
        RawGoods: dept.RawGoods,
        location: dept.location
      });
    }
  }


  // Method to get closing stock for a specific date.
  // Can filter by departmentId (optional) and productId (optional).
  // Returns the relevant goods arrays or specific item.
  async getClosingStock(
    query: any,
    location: string,
    productId?: string,

  ): Promise<any> {
    try {
      const normalizedDate = new Date(query.date);
      normalizedDate.setHours(0, 0, 0, 0); // Normalize to match snapshot date

      if (!query.department || query.department === '' || query.department === 'all') {
        delete query.department
      }

      const snapshots = await this.snapshotModel.find({ ...query }).exec();

      if (!snapshots.length) {
        // If no snapshot, you could fall back to calculating from transactions,
        // but for now, throw an error or return null. Implement calculation if needed.
        throw new Error(`No snapshot available for date ${normalizedDate}`);
      }

      // If productId specified, extract the specific good from the arrays
      if (productId) {
        const results: (DepartmentProduct | RawGoods | null)[] = [];
        for (const snap of snapshots) {
          const fg = snap.finishedGoods.find((g) => g.productId.equals(productId));
          const rg = snap.RawGoods.find((g) => g.productId.equals(productId));
          results.push(fg || rg || null);
        }
        return results;
      }

      // Otherwise, return full snapshots

      return snapshots;
    }
    catch (error) {
      errorLog(`Error getting snap shots: ${error}`, "ERROR")
      throw new BadRequestException(`Error getting snap shots: ${error.message}`);
    }
  }
}
