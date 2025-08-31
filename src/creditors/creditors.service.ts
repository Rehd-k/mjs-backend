import { Injectable } from '@nestjs/common';
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from './dto/update-creditor.dto';

@Injectable()
export class CreditorsService {
  create(createCreditorDto: CreateCreditorDto) {
    return 'This action adds a new creditor';
  }

  findAll() {
    return `This action returns all creditors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} creditor`;
  }

  update(id: number, updateCreditorDto: UpdateCreditorDto) {
    return `This action updates a #${id} creditor`;
  }

  remove(id: number) {
    return `This action removes a #${id} creditor`;
  }
}
