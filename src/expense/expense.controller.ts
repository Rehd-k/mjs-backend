import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expense.service';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Roles } from 'src/helpers/role/roles.decorator';
import { Role } from 'src/helpers/enums';
import { QueryDto } from 'src/product/query.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { ExpensesCategoryService } from './exp.cat.service';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Supervisor)
@Controller('expense')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService, private readonly expensesCategoryService: ExpensesCategoryService) { }


    @Post()
    async createExpense(@Body() body: any, @Req() req: any) {

        return this.expensesService.createExpense(body, req);

    }

    @Patch(':id')
    async updateExpense(@Param('id') id: string, @Body() body: any) {
        return this.expensesService.updateExpense(id, body);
    }

    @Delete(':id')
    async deleteExpense(@Param('id') id: string) {
        return this.expensesService.deleteExpense(id);
    }

    @Get()
    async getExpenses(@Query() query: QueryDto, @Req() req: any) {
        return this.expensesService.getExpenses(query, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff)
    @Get('/total')
    async getTotalExpenses(@Query() query: QueryDto, @Req() req: any) {
        return this.expensesService.getTotalExpenses(query, req);
    }



    @Post('/category')
    async createExpenseCategory(@Body() body: any, @Req() req: any) {
        return this.expensesCategoryService.create(body, req);
    }

    @Patch('/category/update/:id')
    async updateExpensCategory(@Param('id') id: string, @Body() body: any) {
        return this.expensesCategoryService.update(id, body);
    }

    @Delete('/category/delete/:id')
    async deleteExpenseCategory(@Param('id') id: string) {
        return this.expensesCategoryService.delete(id);
    }

    @Get('/category')
    async getExpensesCategories(@Req() req: any) {
        return this.expensesCategoryService.findAll(req);
    }
}
