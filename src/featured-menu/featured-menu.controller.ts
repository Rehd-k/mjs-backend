import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeaturedMenuService } from './featured-menu.service';

@Controller('featured-menu')
export class FeaturedMenuController {
  constructor(private readonly featuredMenuService: FeaturedMenuService) { }

  @Post()
  create(@Body() createFeaturedMenuDto: any) {
    return this.featuredMenuService.create(createFeaturedMenuDto);
  }

  @Get()
  findAll() {
    return this.featuredMenuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featuredMenuService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeaturedMenuDto: any) {
    return this.featuredMenuService.update(+id, updateFeaturedMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.featuredMenuService.remove(+id);
  }
}
