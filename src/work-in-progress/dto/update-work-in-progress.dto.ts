import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkInProgressDto } from './create-work-in-progress.dto';

export class UpdateWorkInProgressDto extends PartialType(CreateWorkInProgressDto) {}
