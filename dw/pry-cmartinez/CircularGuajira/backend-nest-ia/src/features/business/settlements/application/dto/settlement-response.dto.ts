import { ApiProperty } from '@nestjs/swagger';
import { WeighingResponseDto } from './weighing-response.dto.js';

export class SettlementResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  recyclerId!: number;

  @ApiProperty({ example: '2026-09-15T10:00:00.000Z' })
  settlementDate!: Date;

  @ApiProperty({ example: 120000 })
  subtotal!: number;

  @ApiProperty({ example: 0 })
  tax!: number;

  @ApiProperty({ example: 0 })
  discounts!: number;

  @ApiProperty({ example: 120000 })
  total!: number;

  @ApiProperty({ example: 'EMITIDA' })
  status!: string;

  @ApiProperty({ type: [WeighingResponseDto] })
  items!: WeighingResponseDto[];
}
