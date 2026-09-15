import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMaterialRateDto } from './create-material-rate.dto.js';

/**
 * DTO reservado para una futura actualización de tarifas (fuera del
 * alcance de este issue: el controlador actual no expone `PATCH`).
 */
export class UpdateMaterialRateDto extends PartialType(CreateMaterialRateDto) {
  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo de la tarifa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
