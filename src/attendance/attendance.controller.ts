// attendance.controller.ts
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) { }

  @Post()
  markAttendance(
    @Body() body: { userId: string; date: string; status?: string },
  ) {
    return this.service.markAttendance(
      body.userId,
      new Date(body.date),
      body.status,
    );
  }

  @Get()
  getAttendance(
    @Query('userId') userId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.service.getAttendance(userId, month, year);
  }
}
