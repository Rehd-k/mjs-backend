import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar, Role.Supervisor, Role.Accounting, Role.Chef)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  async createNotification(@Body() body: any, @Req() req: any) {
    const { message, recipients, title } = body;
    return this.notificationsService.createNotification(message, recipients, req, title);
  }


  @Post(':recipient')
  async sendToUSer(@Body() body: any, @Req() req: any) {
    const { message, recipient, title } = body;
    console.log(req.body)
    return this.notificationsService.createNotificationForSpecificUser(title, message, recipient, req);
  }


  @Get(':recipient')
  async getNotifications(@Param('recipient') recipient: string, @Req() req: any) {
    return this.notificationsService.getNotifications(recipient, req.user.location);
  }

  @Patch(':id/mark-read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
