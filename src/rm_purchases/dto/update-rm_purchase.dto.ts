import { PartialType } from '@nestjs/mapped-types';
import { CreateRmPurchaseDto } from './create-rm_purchase.dto';

export class UpdateRmPurchaseDto extends PartialType(CreateRmPurchaseDto) {}
