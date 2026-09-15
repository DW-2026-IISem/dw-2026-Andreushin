import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'PET', description: 'Nombre único del material' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Tereftalato de polietileno (botellas plásticas)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 'KG', default: 'KG', description: 'Unidad de medida' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  unitOfMeasure?: string;
}
