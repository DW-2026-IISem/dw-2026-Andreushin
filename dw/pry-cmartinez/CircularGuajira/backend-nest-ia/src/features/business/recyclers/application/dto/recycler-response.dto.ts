import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecyclerResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '900123456' })
  documentNumber!: string;

  @ApiProperty({ example: 'Asociación Recicladores Uribia' })
  name!: string;

  @ApiPropertyOptional({ example: '3001234567', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ example: 'contacto@recicladoresuribia.co', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ example: 'Uribia, La Guajira', nullable: true })
  address!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  updatedAt!: Date;
}
