import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMaterialRateDto } from '../../../application/dto/create-material-rate.dto.js';
import { FindAllMaterialRatesQueryDto } from '../../../application/dto/find-all-material-rates-query.dto.js';
import { MaterialRateResponseDto } from '../../../application/dto/material-rate-response.dto.js';
import { MaterialRateMapper } from '../../../application/mappers/material-rate.mapper.js';
import { CreateMaterialRateUseCase } from '../../../application/use-cases/create-material-rate.use-case.js';
import { GetActiveMaterialRateUseCase } from '../../../application/use-cases/get-active-material-rate.use-case.js';
import {
  FindAllMaterialRatesUseCase,
  type PaginatedMaterialRates,
} from '../../../application/use-cases/find-all-material-rates.use-case.js';
import { FindMaterialRateByIdUseCase } from '../../../application/use-cases/find-material-rate-by-id.use-case.js';

interface PaginatedMaterialRatesResponse {
  items: MaterialRateResponseDto[];
  meta: PaginatedMaterialRates['meta'];
}

/**
 * Controlador HTTP del feature `material-rates`. Delega toda la lógica a
 * los casos de uso de aplicación; no contiene reglas de negocio ni
 * persistencia.
 *
 * Nota de rutas: `vigente/:materialId` se declara ANTES de `:id` para que
 * NestJS no confunda el segmento literal `vigente` con el parámetro `:id`.
 */
@ApiTags('MaterialRates')
@Controller('material-rates')
export class MaterialRatesController {
  constructor(
    private readonly createMaterialRateUseCase: CreateMaterialRateUseCase,
    private readonly getActiveMaterialRateUseCase: GetActiveMaterialRateUseCase,
    private readonly findAllMaterialRatesUseCase: FindAllMaterialRatesUseCase,
    private readonly findMaterialRateByIdUseCase: FindMaterialRateByIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una tarifa de material' })
  @ApiResponse({ status: HttpStatus.CREATED, type: MaterialRateResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'DTO inválido' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'materialId no existe',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'material inactivo o tarifa activa solapada',
  })
  async create(
    @Body() dto: CreateMaterialRateDto,
  ): Promise<MaterialRateResponseDto> {
    const rate = await this.createMaterialRateUseCase.execute(dto);
    return MaterialRateMapper.toResponseDto(rate);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarifas de forma paginada' })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(
    @Query() query: FindAllMaterialRatesQueryDto,
  ): Promise<PaginatedMaterialRatesResponse> {
    const result = await this.findAllMaterialRatesUseCase.execute(query);

    return {
      items: result.items.map((item) => MaterialRateMapper.toResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get('vigente/:materialId')
  @ApiOperation({ summary: 'Obtener la tarifa vigente de un material' })
  @ApiParam({ name: 'materialId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: MaterialRateResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No hay tarifa vigente para el material',
  })
  async findActive(
    @Param('materialId', ParseIntPipe) materialId: number,
  ): Promise<MaterialRateResponseDto> {
    const rate = await this.getActiveMaterialRateUseCase.execute(materialId);
    return MaterialRateMapper.toResponseDto(rate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarifa por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: MaterialRateResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarifa no encontrada',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MaterialRateResponseDto> {
    const rate = await this.findMaterialRateByIdUseCase.execute(id);
    return MaterialRateMapper.toResponseDto(rate);
  }
}
