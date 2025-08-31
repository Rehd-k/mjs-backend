import { PartialType } from '@nestjs/mapped-types';
import { CreateServingSizeDto } from './create-serving-size.dto';

export class UpdateServingSizeDto extends PartialType(CreateServingSizeDto) {}
