import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { WeighingItemDto } from './weighing-item.dto.js';

export class CreateSettlementDto {
  @ApiProperty({ example: 1, description: 'Id del reciclador que entrega el material' })
  @IsInt()
  @Min(1)
  recyclerId!: number;

  @ApiProperty({ type: [WeighingItemDto], description: 'Pesajes de la liquidación, al menos uno' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WeighingItemDto)
  items!: WeighingItemDto[];

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discounts?: number;
}
