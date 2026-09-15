import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Lote PET Transparente' })
  name!: string;

  @ApiPropertyOptional({ example: 'EcoGuajira', nullable: true })
  brand!: string | null;

  @ApiProperty({ example: 1500 })
  price!: number;

  @ApiProperty({ example: 10 })
  minStock!: number;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiProperty({ example: 1 })
  materialId!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  updatedAt!: Date;
}
