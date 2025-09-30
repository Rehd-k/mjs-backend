import { Controller, Query, Req, UseGuards } from '@nestjs/common';
import { Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SalesService } from './sales.service';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { QueryDto } from 'src/product/query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';



@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
    constructor(private readonly salesService: SalesService) { }


    @Roles(Role.God, Role.Admin, Role.Manager, Role.Waiter, Role.Cashier, Role.Supervisor, Role.Accounting)
    @Post()
    create(@Body() createSaleDto: any, @Req() req: any) {
        return this.salesService.doSell(createSaleDto, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Supervisor, Role.Accounting)
    @Get('/send-whatsapp/:id')
    sendMessage(
        @Param('id') id: string
    ) {

    }


    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Waiter, Role.Cashier, Role.Supervisor, Role.Accounting)
    @Get()
    findAll(
        @Query() query: QueryDto, @Req() req: any
    ) {
        return this.salesService.findAll(query, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Supervisor, Role.Accounting)
    @Get('getchart/:id')
    getLineChart(@Param('id') id: string, @Query() query: QueryDto, @Req() req: any) {
        const chartData = this.salesService.getSingleProductSaleData(id, query, req);
        return chartData
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Supervisor, Role.Accounting)
    @Get('findone/:id')
    findOne(@Param('id') id: string) {
        return this.salesService.findOne(id);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateSaleDto: any, @Req() req: any) {
        return this.salesService.update(id, updateSaleDto, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Put('return/:id')
    make_returns(@Param('id') id: string, @Body() updateSaleDto: any, @Req() req: any) {
        return this.salesService.return(id, updateSaleDto, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return this.salesService.delete(id, req);
    }


    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Get('all-sells-data')
    totalSalesData(@Query() query: QueryDto, @Req() req: any) {
        return this.salesService.calculateSalesTotals(query, req);
    }

}
