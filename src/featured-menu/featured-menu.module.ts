import { Module } from '@nestjs/common';
import { FeaturedMenuService } from './featured-menu.service';
import { FeaturedMenuController } from './featured-menu.controller';

@Module({
  controllers: [FeaturedMenuController],
  providers: [FeaturedMenuService],
})
export class FeaturedMenuModule {}
