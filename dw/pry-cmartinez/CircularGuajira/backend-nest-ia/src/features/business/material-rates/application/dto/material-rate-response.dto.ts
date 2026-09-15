import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialRateResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  materialId!: number;

  @ApiProperty({ example: 1200 })
  pricePerKg!: number;

  @ApiProperty({ example: 0 })
  minStockKg!: number;

  @ApiProperty({ example: 0 })
  stockKg!: number;

  @ApiProperty({ example: '2026-09-15' })
  startDate!: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  endDate!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
