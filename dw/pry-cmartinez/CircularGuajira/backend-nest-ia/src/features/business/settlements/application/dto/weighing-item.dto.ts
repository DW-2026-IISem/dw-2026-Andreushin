import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class WeighingItemDto {
  @ApiProperty({ example: 1, description: 'Id del material pesado' })
  @IsInt()
  @Min(1)
  materialId!: number;

  @ApiProperty({ example: 105.5, description: 'Peso bruto en kg (con tara)' })
  @IsNumber()
  @IsPositive()
  grossWeight!: number;

  @ApiProperty({ example: 5.5, description: 'Peso de la tara en kg' })
  @IsNumber()
  @Min(0)
  tareWeight!: number;
}
