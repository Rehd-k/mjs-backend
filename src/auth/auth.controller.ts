import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtAuthGuard } from 'src/helpers/jwt-auth.guard';
import { RolesGuard } from 'src/helpers/roles/roles.guard';
import { Role } from 'src/helpers/roles/enum';
import { Roles } from 'src/helpers/roles/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string; location: string }) {
    try {
      const user = await this.authService.validateUser(body.username, body.password, body.location);

      const result = this.authService.login(user);

      return result
    } catch (error) {
      throw error;
    }



  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.God, Role.Admin, Role.Manager)
  @Post('register')
  async register(@Req() req: any, @Body() body: any) {

    return this.authService.create({ ...body, req });

  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProtectedRoute(@Req() req: any) {
    return { message: `Hello ${req.user.username}, you have ${req.user.role} access!` };
  }
}
