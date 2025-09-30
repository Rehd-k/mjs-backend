import { BadRequestException, Controller, Delete, Patch, Put, Req, UseGuards } from '@nestjs/common';
import { Get, Post, Body, Param, Query } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { Types } from 'mongoose';
import { QueryDto } from 'src/product/query.dto';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor, Role.Bar, Role.Cashier, Role.Waiter, Role.Accounting)
@Controller('purchases')
export class PurchasesController {

    constructor(private readonly purchasesService: PurchasesService) { }

    // @Roles(Role.God, Role.Admin, Role.Manager)
    @Post()
    create(@Body() createPurchaseDto: any, @Req() req: any) {
        return this.purchasesService.create(createPurchaseDto, req);
    }

    // @Roles(Role.God, Role.Admin, Role.Manager)
    @Post('make-payment')
    MakePAyment(@Body() createPurchaseDto: any, @Req() req: any) {
        return this.purchasesService.updatePurchasePayment(createPurchaseDto, req);
    }


    // @Roles(Role.God, Role.Admin, Role.Manager)
    @Get()
    findAll(
        @Query() query: QueryDto,
        @Req() req: any
    ) {

        return this.purchasesService.findAll(query, req);
    }

    // @Roles(Role.God, Role.Admin, Role.Manager)
    @Get('findOne/:id')
    findOne(@Param('id') id: string) {
        return this.purchasesService.findOne(id);
    }



    // @Roles(Role.God, Role.Admin, Role.Manager)

    @Patch('update/:id')
    async update(@Param('id') id: string, @Body() updatePurchaseDto: any,
        @Req() req: any) {

        return await this.purchasesService.update(id, updatePurchaseDto, req);

    }

    @Put('doDamage/:id')
    async doDamage(@Param('id') id: string, @Body() updatePurchaseDto: any, @Req() req: any) {
        return this.purchasesService.doDamagedGood(id, updatePurchaseDto, req);
    }


    @Put('return/:id')
    async doReturn(@Param('id') id: string, @Body() updatePurchaseDto: any, @Req() req: any) {
        return this.purchasesService.doReturns(id, updatePurchaseDto, req);
    }


    @Get('vendors')
    getVendorsOrders(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return this.purchasesService.getSuppliersPurchases(query, req);
    }

    @Get('getTotals')
    pruchasesTotalsData(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return this.purchasesService.pruchasesTotalsData(query, req);
    }


}
