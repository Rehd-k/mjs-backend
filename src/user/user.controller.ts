import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { UserService } from './user.service';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { QueryDto } from 'src/product/query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }


    @Post('godadd')
    async create(@Body() body: any) {
        return this.userService.create(body)
    }


    @Roles(Role.God, Role.Admin, Role.Manager)
    @Get()
    async getAllUsers(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return await this.userService.getAllUsers(query, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Get(':username')
    async findOneByUsername(@Param('username') username: string) {
        return this.userService.findOneByUsername(username);
    }


    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Get(':id')
    async getOneById(@Param('id') id: string) {
        return this.userService.getOneById(id);
    }

    @Roles(Role.God, Role.Admin)
    @Put(':id')
    async updateOneById(@Param('id') id: string, @Body() user: any) {
        return this.userService.updateOneById(id, user);
    }

    @Roles(Role.God, Role.Admin)
    @Delete(':id')
    async deleteOneById(@Param('id') id: string) {
        return this.userService.deleteOneById(id);
    }
}
