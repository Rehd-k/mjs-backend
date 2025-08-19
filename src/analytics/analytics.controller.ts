import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Roles } from 'src/helpers/role/roles.decorator';
import { Role } from 'src/helpers/enums';
import { QueryDto } from 'src/product/query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Roles(Role.God, Role.Admin)
    @Get('/sales-dashboard')
    async getSalesDashboard(
        @Req() req: any,
    ) {
        return this.analyticsService.getSalesDashboard(req);
    }

    @Roles(Role.God, Role.Admin)
    @Get('/revenue-reports')
    async getRevenueReports(
        @Req() req: any,
    ) {
        return this.analyticsService.getRevenueReports(req);
    }

    @Roles(Role.God, Role.Admin)
    @Get('/inventory-reports')
    async getInventoryReports(
        @Req() req: any,
    ) {
        return this.analyticsService.getInventoryReports(req);
    }

    @Roles(Role.God, Role.Admin)
    @Get('/profit-and-loss')
    async getProfitAndLoss(@Query() query: QueryDto, @Req() req: any,) {
        return this.analyticsService.getProfitAndLoss(query, req);
    }

    @Roles(Role.God, Role.Admin)
    @Get('/get-best-selling-products')
    async getBestSellingProducts(
        @Req() req: any,
    ) {
        return this.analyticsService.getTopSellingProducts(req);
    }

    @Roles(Role.God, Role.Admin)
    @Get('/inventory-summary')
    async inventorySummary(
        @Req() req: any,
    ) {
        return this.analyticsService.getProductStatistics(req);
    }

    @Roles(Role.God, Role.Admin)
    @Get('/customer-summary')
    async customerSummary(
        @Req() req: any,
    ) {
        return this.analyticsService.getCustomerStatistics(req);
    }

    @Roles(Role.God, Role.Admin)
    @Get('/sales-data')
    async WeeklySalesData(
        @Req() req: any,
    ) {
        const data = await this.analyticsService.getWeeklySalesData(req);

        return data;
    }

    @Roles(Role.God, Role.Admin)
    @Get('/get-sales-chart')
    async GetSalesData(
        @Query() query: QueryDto,
        @Req() req: any,
    ) {
        const filterOption = query.filter ?? "Today";
        const data = await this.analyticsService.getSalesData(filterOption, req);

        return data;
    }


    @Roles(Role.God, Role.Admin)
    @Get('/get-products-report')
    async GetProductsReport(
        @Query() id: any,
        @Query() start: any,
        @Query() end: any,

    ) {

        return this.analyticsService.getProductDailyReport(id.id, start.start, end.end)
    }




}
