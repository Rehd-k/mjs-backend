import { Controller, Query, Req, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Get, Post, Body, Param } from '@nestjs/common';
import { QueryDto } from 'src/product/query.dto';
import { RolesGuard } from 'src/helpers/role/roles.guard';
import { Role } from 'src/helpers/enums';
import { Roles } from 'src/helpers/role/roles.decorator';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Waiter, Role.Cashier, Role.God, Role.Supervisor)
    @Get()
    findAll(
        @Query() query: QueryDto,
        @Req() req: any
    ) {
        return this.customerService.getAllCustomers(query, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.God, Role.Supervisor)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.customerService.getCustomerDetails(id);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.God, Role.Supervisor)
    @Post()
    create(@Body() createCustomerDto: any, @Req() req: any) {
        return this.customerService.createCustomer(createCustomerDto, req);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.God, Role.Supervisor)
    @Post(':id')
    update(@Param('id') customerId: string, @Body() updateCustomerDto: any) {
        return this.customerService.updateCustomer(customerId, updateCustomerDto);
    }

    @Roles(Role.God, Role.Admin, Role.Manager, Role.Staff, Role.Cashier, Role.God, Role.Supervisor)
    @Post(':id/delete')
    delete(@Param('id') id: string) {
        return this.customerService.deleteCustomer(id);
    }
}
