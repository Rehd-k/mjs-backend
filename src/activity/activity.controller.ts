import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { QueryDto } from 'src/product/query.dto';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';



@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activity')
export class ActivityController {
    constructor(private readonly activityLogService: ActivityService) { }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Accounting)
    @Get()
    async getLogs(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return this.activityLogService.getLogs(query, req);
    }
}
