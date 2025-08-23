import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting } from './entities/setting.entity';
import { SettingsSchema } from './settings.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Setting.name, schema: SettingsSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule { }
