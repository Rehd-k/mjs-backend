import { Injectable } from '@nestjs/common';

@Injectable()
export class FeaturedMenuService {
  create(createFeaturedMenuDto: any) {
    return 'This action adds a new featuredMenu';
  }

  findAll() {
    return `This action returns all featuredMenu`;
  }

  findOne(id: number) {
    return `This action returns a #${id} featuredMenu`;
  }

  update(id: number, updateFeaturedMenuDto: any) {
    return `This action updates a #${id} featuredMenu`;
  }

  remove(id: number) {
    return `This action removes a #${id} featuredMenu`;
  }
}
