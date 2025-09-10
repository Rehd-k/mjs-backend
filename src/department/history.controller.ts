import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "src/helpers/enums";
import { JwtAuthGuard } from "src/helpers/jwt-auth.guard";
import { Roles } from "src/helpers/roles/roles.decorator";
import { RolesGuard } from "src/helpers/roles/roles.guard";
import { DepartmentHistoryService } from "./department.history.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
@Controller('department-history')
export class DepartmentHistortyController {
    constructor(private readonly departmentHistoryService: DepartmentHistoryService) { }

    @Post()
    create(@Body() createDepartmentDto: any, @Req() req: any) {
        return this.departmentHistoryService.createHistory(createDepartmentDto, req);
    }

    @Get('approve/:id/:section')
    async pproveHistory(
        @Req() req: any,
        @Param('id') id: string,
        @Param('section') section: string
    ) {
        return this.departmentHistoryService.handleAprove(id, req, section)
    }

    @Get()
    async findAll(
        @Req() req: any,
        @Query() query: any
    ) {
        return await this.departmentHistoryService.findAll(req, query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.departmentHistoryService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateDepartmentDto: any, @Query() filter: any,) {
        return await this.departmentHistoryService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.departmentHistoryService.remove(id);
    }

}