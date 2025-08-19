import { PartialType } from '@nestjs/mapped-types';
import { CreateOutwardPaymentDto } from './create-outward-payment.dto';

export class UpdateOutwardPaymentDto extends PartialType(CreateOutwardPaymentDto) {}
