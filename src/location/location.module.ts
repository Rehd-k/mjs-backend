import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Location, LocationSchema } from './location.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
      MongooseModule.forFeature([{ name: Location.name, schema: LocationSchema }]),
    ],
  providers: [LocationService],
  controllers: [LocationController]
})
export class LocationModule {}
