import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { UserModule } from 'src/user/user.module';
import { FirebaseController } from './firebase.controller';

@Module({
  imports: [UserModule],
  providers: [FirebaseService],
  exports: [FirebaseService],
  controllers: [FirebaseController],
})
export class FirebaseModule { }
