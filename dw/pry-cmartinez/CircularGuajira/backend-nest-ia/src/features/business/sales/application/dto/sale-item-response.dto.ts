import { ApiProperty } from '@nestjs/swagger';

export class SaleItemResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 1500 })
  unitPrice!: number;

  @ApiProperty({ example: 3000 })
  total!: number;
}
