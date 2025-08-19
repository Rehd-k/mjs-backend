import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
    @Post()
    async createSupplier(@Body() data: any, @Req() req: any) {
        return this.supplierService.createSupplier(data, req);
    }

    @Post(':id/orders')
    async addOrder(@Param('id') supplierId: Types.ObjectId, @Body() order: any) {
        return this.supplierService.addOrder(supplierId, order);
    }

    @Get()
    async getSuppliers(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return this.supplierService.getAllSuppliers(query, req);
    }


    @Get(':id')
    async getSupplierDetails(@Param('id') supplierId: string) {
        return this.supplierService.getSupplierDetails(supplierId);
    }
}
