import { PartialType } from '@nestjs/mapped-types';
import { CreateStockFlowDto } from './create-stock-flow.dto';

export class UpdateStockFlowDto extends PartialType(CreateStockFlowDto) {}
