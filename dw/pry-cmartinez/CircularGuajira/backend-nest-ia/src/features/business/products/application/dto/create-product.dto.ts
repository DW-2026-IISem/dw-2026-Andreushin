import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Lote PET Transparente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'EcoGuajira' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiProperty({ example: 1500, description: 'Precio unitario, debe ser mayor a 0' })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Stock mínimo' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 100, default: 0, description: 'Cantidad inicial en inventario' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiProperty({ example: 1, description: 'Id del material asociado (debe existir y estar activo)' })
  @IsInt()
  materialId!: number;
}
