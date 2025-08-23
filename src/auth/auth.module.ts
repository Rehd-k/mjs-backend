import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Auth, AuthSchema } from './entities/auth.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/helpers/jwt.strategy';
import { User, UserSchema } from 'src/user/user.schema';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'your_jwt_secret', // Replace with a secure value in .env
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }, { name: User.name, schema: UserSchema }]),

  ]

})
export class AuthModule { }
