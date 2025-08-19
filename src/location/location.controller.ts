import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { QueryDto } from 'src/product/query.dto';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@Controller('location')
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin)
    @Post()
    async createStore(@Body() body: any, @Req() req: any) {
        const { name, location, manager, contact, firm_name } = body;
        return this.locationService.createStore(name, location, manager, contact, req, firm_name);
    }

    @Get()
    async getStores(
        @Query() query: QueryDto
    ) {
        return this.locationService.getStores(query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin)
    @Get(':id')
    async getStoreById(@Param('id') storeId: string) {
        return this.locationService.getStoreById(storeId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin)
    @Patch(':id')
    async updateStoreById(@Param('id') storeId: string, @Body() updateDto: any) {
        return this.locationService.update(storeId, updateDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin, Role.Manager)
    @Delete(':id')
    async deleteProduct(@Param('id') storeId: string) {
        return this.locationService.remove(storeId);
    }

}
