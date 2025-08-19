import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Auth } from './entities/auth.entity';
import { Model } from 'mongoose';
import { errorLog } from 'src/helpers/do_loggers';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly authModel: Model<User>,
    private readonly jwtService: JwtService
  ) { }

  async create(createAuthDto: CreateAuthDto) {
    try {
      return await this.authModel.create(createAuthDto);
    } catch (error) {
      if (error && error.code === 11000) {
        let errMessage = `User with username ${(error.errorResponse.keyValue.username)} already exists`;
        errorLog(`${errMessage}`, "ERROR")
        throw new BadRequestException(errMessage);
      }
      if (error && error.name === "ValidationError")
        errorLog(`ValidationError`, "ERROR")
      throw new InternalServerErrorException(error.message);
    }
  }

  findOneByUsername(username: string, location: string) {

    return this.authModel.findOne({ username, location }).exec();
  }

  async validateUser(username: string, password: string, location: string): Promise<any> {
    const user = await this.findOneByUsername(username, location);
    if (!user) {
      throw new UnauthorizedException('User not found in this location');
    }
    if (user && password === user.password) {
      const { password, ...result } = user.toObject();
      return result;
    } else {

      throw new UnauthorizedException('Invalid password');
    }

  }



  async login(user: any) {
    const payload = { username: user.username, sub: user._id, role: user.role, location: user.location };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
