import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Types } from 'mongoose';
import { QueryDto } from 'src/product/query.dto';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('supplier')
export class SupplierController {
    constructor(private readonly supplierService: SupplierService) { }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor, Role.Accounting)
    @Post()
    async createSupplier(@Body() data: any, @Req() req: any) {
        return this.supplierService.createSupplier(data, req);
    }

    // @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor)
    // @Post(':id/orders')
    // async addOrder(@Param('id') supplierId: Types.ObjectId, @Body() order: any) {
    //     return this.supplierService.addOrder(supplierId, order, 0, null as Types.ObjectId);
    // }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor, Role.Accounting, Role.Store)
    @Get()
    async getSuppliers(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return this.supplierService.getAllSuppliers(query, req);
    }


    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor, Role.Accounting)
    @Get('dashbaord')
    async getSuppliersDashboard(
        @Req() req: any
    ) {
        return this.supplierService.getSupplierDashboard(req);
    }



    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor, Role.Bar, Role.Cashier, Role.Waiter, Role.Accounting)
    @Get(':id')
    async getSupplierDetails(@Param('id') supplierId: string) {
        return this.supplierService.getSupplierDetails(supplierId);
    }

    @Patch(':id')
    async updateSuppliersInfo(@Param('id') supplierId: string, @Body() body: any) {
        return this.supplierService.updateSuplierById(supplierId, body);
    }
}
