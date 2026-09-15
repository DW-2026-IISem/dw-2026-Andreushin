import { ApiProperty } from '@nestjs/swagger';
import { SaleItemResponseDto } from './sale-item-response.dto.js';

export class SaleResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '2026-09-15T10:00:00.000Z' })
  saleDate!: Date;

  @ApiProperty({ example: 3000 })
  subtotal!: number;

  @ApiProperty({ example: 0 })
  tax!: number;

  @ApiProperty({ example: 0 })
  discounts!: number;

  @ApiProperty({ example: 3000 })
  total!: number;

  @ApiProperty({ example: 'COMPLETED' })
  status!: string;

  @ApiProperty({ example: 1 })
  clientId!: number;

  @ApiProperty({ type: [SaleItemResponseDto] })
  items!: SaleItemResponseDto[];
}
