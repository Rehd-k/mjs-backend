import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "src/helpers/enums";
import { JwtAuthGuard } from "src/helpers/jwt-auth.guard";
import { Roles } from "src/helpers/roles/roles.decorator";
import { RolesGuard } from "src/helpers/roles/roles.guard";
import { StoreHistoryService } from "./store.history.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
@Controller('store-history')
export class StoreHistortyController {
    constructor(private readonly storeHistoryService: StoreHistoryService) { }

    @Post()
    create(@Body() createStoreDto: any, @Req() req: any) {
        return this.storeHistoryService.createHistory(createStoreDto, req);
    }

    @Get()
    async findAll(
        @Req() req: any,
        @Query() query: any
    ) {
        return await this.storeHistoryService.findAll(req, query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.storeHistoryService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateStoreDto: any, @Query() filter: any,) {
        return await this.storeHistoryService.update(id, updateStoreDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.storeHistoryService.remove(id);
    }

}