import { PartialType } from '@nestjs/mapped-types';
import { CreateInwardPaymentDto } from './create-inward-payment.dto';

export class UpdateInwardPaymentDto extends PartialType(CreateInwardPaymentDto) {}
