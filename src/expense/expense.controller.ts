import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expense.service';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Roles } from 'src/helpers/role/roles.decorator';
import { Role } from 'src/helpers/enums';
import { QueryDto } from 'src/product/query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expense')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) { }


    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
    @Post()
    async createExpense(@Body() body: any, @Req() req: any) {
        try {
            return this.expensesService.createExpense(body, req);
        } catch (error) {
        }

    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
    @Put('/update/:id')
    async updateExpense(@Param('id') id: string, @Body() body: any) {
        return this.expensesService.updateExpense(id, body);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
    @Delete('/delete/:id')
    async deleteExpense(@Param('id') id: string) {
        return this.expensesService.deleteExpense(id);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
    @Get()
    async getExpenses(@Query() query: QueryDto, @Req() req: any) {
        return this.expensesService.getExpenses(query, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
    @Get('/total')
    async getTotalExpenses(@Query() query: QueryDto, @Req() req: any) {
        return this.expensesService.getTotalExpenses(query, req);
    }
}
