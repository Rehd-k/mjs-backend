// attendance.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance } from './attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
  ) { }

  async markAttendance(userId: string, date: Date, status = 'present') {
    return this.attendanceModel.findOneAndUpdate(
      { userId, date },
      { userId, date, status },
      { upsert: true, new: true },
    );
  }

  async getAttendance(userId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return this.attendanceModel.find({
      userId,
      date: { $gte: start, $lte: end },
    });
  }
}
