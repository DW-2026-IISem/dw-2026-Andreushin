import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class SaleItemDto {
  @ApiProperty({ example: 1, description: 'Id del producto vendido' })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 2, description: 'Cantidad vendida' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    example: 1500,
    description: 'Precio unitario; si no se envía, se toma el precio actual del producto',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;
}
