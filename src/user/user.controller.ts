import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { UserService } from './user.service';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { QueryDto } from 'src/product/query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/helpers/multer.config';
import { CustomerService } from 'src/customer/customer.service';


@Controller('user')
export class UserController {
    constructor(private userService: UserService, private customerService: CustomerService) { }


    @Post('godadd')
    async create(@Body() body: any) {
        return this.userService.create(body)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin, Role.Manager)
    @Get()
    async getAllUsers(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return await this.userService.getAllUsers(query, req);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Get('username/:username')
    async findOneByUsername(@Param('username') username: string) {
        return this.userService.findOneByUsername(username);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Get('id/:id')
    async getOneById(@Param('id') id: string) {
        return this.userService.getOneById(id);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier)
    @Patch(':id')
    async updateOneById(@Param('id') id: string, @Body() user: any, @Req() req: any) {
        return this.userService.updateOneById(id, user, req);
    }

    @Post('multiple/:id')
    @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
    uploadMultiple(@UploadedFiles() files: Array<Express.Multer.File>, @Param() id: string) {
        files.map(file => ({
            filename: file.originalname,
            size: file.size,
            path: file.path,
        }));
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.God, Role.Admin)
    @Delete(':id')
    async deleteOneById(@Param('id') id: string) {
        return this.userService.deleteOneById(id);
    }
}
