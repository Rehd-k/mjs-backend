import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { QueryDto } from 'src/product/query.dto';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Post()
    async createCategory(@Body() body: any, @Req() req: any) {
        return this.categoryService.createCategory(body, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Get()
    async getCategorys(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        try {
            return this.categoryService.getCategorys(query, req);
        } catch (err) {
            throw new InternalServerErrorException(err);
        }

    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Get(':id')
    async getCategoryById(@Param('id') CategoryId: string) {
        return this.categoryService.getCategoryById(CategoryId);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Put(':id')
    async updateCategoryById(@Param('id') CategoryId: string, @Body() updateDto: any) {
        return this.categoryService.update(CategoryId, updateDto);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Delete(':id')
    async deleteProduct(@Param('id') CategoryId: string) {
        return this.categoryService.remove(CategoryId);
    }
}
