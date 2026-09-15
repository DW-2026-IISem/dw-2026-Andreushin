import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSettlementDto } from '../../../application/dto/create-settlement.dto.js';
import { SettlementResponseDto } from '../../../application/dto/settlement-response.dto.js';
import { SettlementMapper } from '../../../application/mappers/settlement.mapper.js';
import { CreateSettlementUseCase } from '../../../application/use-cases/create-settlement.use-case.js';
import { GetSettlementByIdUseCase } from '../../../application/use-cases/get-settlement-by-id.use-case.js';

/**
 * Controlador HTTP del feature `settlements`. Delega toda la lógica a los
 * casos de uso de aplicación; no contiene reglas de negocio ni
 * persistencia.
 */
@ApiTags('Settlements')
@Controller('settlements')
export class SettlementsController {
  constructor(
    private readonly createSettlementUseCase: CreateSettlementUseCase,
    private readonly getSettlementByIdUseCase: GetSettlementByIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una liquidación con sus pesajes (transacción atómica)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SettlementResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'DTO inválido, sin ítems o peso inválido (INV-01)' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reciclador no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Reciclador inactivo o sin tarifa activa para el material (INV-02)',
  })
  async create(@Body() dto: CreateSettlementDto): Promise<SettlementResponseDto> {
    const settlement = await this.createSettlementUseCase.execute(dto);
    return SettlementMapper.toResponseDto(settlement);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle completo de una liquidación con sus pesajes' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: SettlementResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Liquidación no encontrada',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SettlementResponseDto> {
    const settlement = await this.getSettlementByIdUseCase.execute(id);
    return SettlementMapper.toResponseDto(settlement);
  }
}
