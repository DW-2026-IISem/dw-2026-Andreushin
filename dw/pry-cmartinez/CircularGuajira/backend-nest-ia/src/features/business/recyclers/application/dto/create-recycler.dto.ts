import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRecyclerDto {
  @ApiProperty({
    example: '900123456',
    description: 'Número de documento único del reciclador u organización',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentNumber!: string;

  @ApiProperty({ example: 'Asociación Recicladores Uribia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@recicladoresuribia.co' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: 'Uribia, La Guajira' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
