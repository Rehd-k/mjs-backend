import { PartialType } from '@nestjs/mapped-types';
import { CreateReqisitionDto } from './create-reqisition.dto';

export class UpdateReqisitionDto extends PartialType(CreateReqisitionDto) {}
