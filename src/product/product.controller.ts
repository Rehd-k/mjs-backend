import { Controller, Delete, InternalServerErrorException, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Get, Post, Body, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { QueryDto } from './query.dto';
import { Types } from 'mongoose';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService, private readonly inventoryService: InventoryService) { }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Post()
    async createProduct(@Body() productDto: any, @Req() req: any) {
        return this.productService.create(productDto, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.Supervisor, Role.Accounting)
    @Get()
    async getAllProducts(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        const data = await this.productService.findAll(query, req);
        return data;
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Get('/dashboard/:id')
    async getDashboardData(
        @Param('id') id: string,
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        try {
            const data = await this.inventoryService.getDashboardData(id);

            return data;
        } catch (error) {

            throw new InternalServerErrorException(error)
        }


    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Get('/findone/:id')
    async getProductById(@Param('id') productId: string) {

        return this.productService.findOne(productId);


    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Put('/update/:id')
    async updateProduct(@Param('id') productId: Types.ObjectId, @Body() updateDto: any) {
        return this.productService.update(productId, updateDto);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Supervisor, Role.Accounting)
    @Delete('/delete/:id')
    async deleteProduct(@Param('id') productId: string) {
        return this.productService.remove(productId);
    }
}
