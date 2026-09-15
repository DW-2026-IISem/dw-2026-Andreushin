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
import { CreateSaleDto } from '../../../application/dto/create-sale.dto.js';
import { SaleResponseDto } from '../../../application/dto/sale-response.dto.js';
import { SaleMapper } from '../../../application/mappers/sale.mapper.js';
import { CreateSaleUseCase } from '../../../application/use-cases/create-sale.use-case.js';
import { GetSaleByIdUseCase } from '../../../application/use-cases/get-sale-by-id.use-case.js';

/**
 * Controlador HTTP del feature `sales`. Delega toda la lógica a los casos
 * de uso de aplicación; no contiene reglas de negocio ni persistencia.
 */
@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(
    private readonly createSaleUseCase: CreateSaleUseCase,
    private readonly getSaleByIdUseCase: GetSaleByIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una venta con sus ítems (transacción atómica)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SaleResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'DTO inválido o sin ítems' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente o producto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Stock insuficiente',
  })
  async create(@Body() dto: CreateSaleDto): Promise<SaleResponseDto> {
    const sale = await this.createSaleUseCase.execute(dto);
    return SaleMapper.toResponseDto(sale);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle completo de una venta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: SaleResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venta no encontrada',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SaleResponseDto> {
    const sale = await this.getSaleByIdUseCase.execute(id);
    return SaleMapper.toResponseDto(sale);
  }
}
