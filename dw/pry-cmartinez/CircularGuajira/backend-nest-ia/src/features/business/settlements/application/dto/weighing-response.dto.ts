import { ApiProperty } from '@nestjs/swagger';

export class WeighingResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  materialId!: number;

  @ApiProperty({ example: 105.5 })
  grossWeight!: number;

  @ApiProperty({ example: 5.5 })
  tareWeight!: number;

  @ApiProperty({ example: 100 })
  netWeight!: number;

  @ApiProperty({ example: 1200 })
  pricePerKg!: number;

  @ApiProperty({ example: 120000 })
  total!: number;
}
