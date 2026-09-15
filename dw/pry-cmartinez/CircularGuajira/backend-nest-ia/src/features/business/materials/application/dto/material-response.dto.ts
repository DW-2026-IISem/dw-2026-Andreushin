import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'PET' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Tereftalato de polietileno (botellas plásticas)',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'KG' })
  unitOfMeasure!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  updatedAt!: Date;
}
