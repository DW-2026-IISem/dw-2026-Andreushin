import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateMaterialRateDto {
  @ApiProperty({ example: 1, description: 'Id del material (ISS-04) al que aplica la tarifa' })
  @IsInt()
  materialId!: number;

  @ApiProperty({ example: 1200, description: 'Precio por kilogramo, debe ser mayor a 0' })
  @IsNumber()
  @IsPositive()
  pricePerKg!: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Stock mínimo en kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockKg?: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Stock inicial acumulado en kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockKg?: number;

  @ApiProperty({ example: '2026-09-15', description: 'Fecha desde la que rige la tarifa' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Fecha hasta la que rige; si no se envía, queda vigente indefinidamente',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
