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
import { SaleItemDto } from './sale-item.dto.js';

export class CreateSaleDto {
  @ApiProperty({ example: 1, description: 'Id del cliente (reciclador) que compra' })
  @IsInt()
  @Min(1)
  clientId!: number;

  @ApiProperty({ type: [SaleItemDto], description: 'Ítems de la venta, al menos uno' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

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
