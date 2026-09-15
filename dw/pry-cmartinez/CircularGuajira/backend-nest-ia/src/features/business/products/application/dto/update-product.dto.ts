import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo del producto' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
