import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { StockSnapshotService } from './stock-snapshot.service';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/roles/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { RolesGuard } from 'src/helpers/roles/roles.guard';



@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Waiter, Role.Bar, Role.Supervisor, Role.Accounting, Role.Chef, Role.Store, Role.Manager)
@Controller('stock-snapshot')
export class StockSnapshotController {
    constructor(private readonly stockSnapshotService: StockSnapshotService) { }
    @Get()
    findAll(
        @Req() req: any,
        @Query() query: any
    ) {
        return this.stockSnapshotService.getClosingStock(query, req.user.location);
    }
}
