import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMaterialDto } from './create-material.dto.js';

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {
  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo del material' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
