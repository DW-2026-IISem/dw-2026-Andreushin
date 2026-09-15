import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMaterialDto } from '../../../application/dto/create-material.dto.js';
import { FindAllMaterialsQueryDto } from '../../../application/dto/find-all-materials-query.dto.js';
import { MaterialResponseDto } from '../../../application/dto/material-response.dto.js';
import { UpdateMaterialDto } from '../../../application/dto/update-material.dto.js';
import { MaterialMapper } from '../../../application/mappers/material.mapper.js';
import { CreateMaterialUseCase } from '../../../application/use-cases/create-material.use-case.js';
import {
  FindAllMaterialsUseCase,
  type PaginatedMaterials,
} from '../../../application/use-cases/find-all-materials.use-case.js';
import { FindMaterialByIdUseCase } from '../../../application/use-cases/find-material-by-id.use-case.js';
import { UpdateMaterialUseCase } from '../../../application/use-cases/update-material.use-case.js';

interface PaginatedMaterialsResponse {
  items: MaterialResponseDto[];
  meta: PaginatedMaterials['meta'];
}

/**
 * Controlador HTTP del feature `materials`. Delega toda la lógica a los
 * casos de uso de aplicación; no contiene reglas de negocio ni persistencia.
 */
@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly createMaterialUseCase: CreateMaterialUseCase,
    private readonly findAllMaterialsUseCase: FindAllMaterialsUseCase,
    private readonly findMaterialByIdUseCase: FindMaterialByIdUseCase,
    private readonly updateMaterialUseCase: UpdateMaterialUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo material' })
  @ApiResponse({ status: HttpStatus.CREATED, type: MaterialResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'DTO inválido' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'name duplicado',
  })
  async create(@Body() dto: CreateMaterialDto): Promise<MaterialResponseDto> {
    const material = await this.createMaterialUseCase.execute(dto);
    return MaterialMapper.toResponseDto(material);
  }

  @Get()
  @ApiOperation({ summary: 'Listar materiales de forma paginada' })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(
    @Query() query: FindAllMaterialsQueryDto,
  ): Promise<PaginatedMaterialsResponse> {
    const result = await this.findAllMaterialsUseCase.execute(query);

    return {
      items: result.items.map((item) => MaterialMapper.toResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un material por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: MaterialResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Material no encontrado',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MaterialResponseDto> {
    const material = await this.findMaterialByIdUseCase.execute(id);
    return MaterialMapper.toResponseDto(material);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un material existente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: MaterialResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Material no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'name duplicado',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
  ): Promise<MaterialResponseDto> {
    const material = await this.updateMaterialUseCase.execute(id, dto);
    return MaterialMapper.toResponseDto(material);
  }
}
