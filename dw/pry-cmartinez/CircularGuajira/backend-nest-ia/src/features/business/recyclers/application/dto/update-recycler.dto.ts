import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRecyclerDto } from './create-recycler.dto.js';

export class UpdateRecyclerDto extends PartialType(CreateRecyclerDto) {
  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo del reciclador' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
