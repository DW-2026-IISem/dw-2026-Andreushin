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
import { CreateRecyclerDto } from '../../../application/dto/create-recycler.dto.js';
import { FindAllRecyclersQueryDto } from '../../../application/dto/find-all-recyclers-query.dto.js';
import { RecyclerResponseDto } from '../../../application/dto/recycler-response.dto.js';
import { UpdateRecyclerDto } from '../../../application/dto/update-recycler.dto.js';
import { RecyclerMapper } from '../../../application/mappers/recycler.mapper.js';
import { CreateRecyclerUseCase } from '../../../application/use-cases/create-recycler.use-case.js';
import {
  FindAllRecyclersUseCase,
  type PaginatedRecyclers,
} from '../../../application/use-cases/find-all-recyclers.use-case.js';
import { FindRecyclerByIdUseCase } from '../../../application/use-cases/find-recycler-by-id.use-case.js';
import { UpdateRecyclerUseCase } from '../../../application/use-cases/update-recycler.use-case.js';

interface PaginatedRecyclersResponse {
  items: RecyclerResponseDto[];
  meta: PaginatedRecyclers['meta'];
}

/**
 * Controlador HTTP del feature `recyclers`. Delega toda la lógica a los
 * casos de uso de aplicación; no contiene reglas de negocio ni persistencia.
 */
@ApiTags('Recyclers')
@Controller('recyclers')
export class RecyclersController {
  constructor(
    private readonly createRecyclerUseCase: CreateRecyclerUseCase,
    private readonly findAllRecyclersUseCase: FindAllRecyclersUseCase,
    private readonly findRecyclerByIdUseCase: FindRecyclerByIdUseCase,
    private readonly updateRecyclerUseCase: UpdateRecyclerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo reciclador' })
  @ApiResponse({ status: HttpStatus.CREATED, type: RecyclerResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'DTO inválido' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'documentNumber duplicado',
  })
  async create(@Body() dto: CreateRecyclerDto): Promise<RecyclerResponseDto> {
    const recycler = await this.createRecyclerUseCase.execute(dto);
    return RecyclerMapper.toResponseDto(recycler);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recicladores de forma paginada' })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(
    @Query() query: FindAllRecyclersQueryDto,
  ): Promise<PaginatedRecyclersResponse> {
    const result = await this.findAllRecyclersUseCase.execute(query);

    return {
      items: result.items.map((item) => RecyclerMapper.toResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un reciclador por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: RecyclerResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reciclador no encontrado',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RecyclerResponseDto> {
    const recycler = await this.findRecyclerByIdUseCase.execute(id);
    return RecyclerMapper.toResponseDto(recycler);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un reciclador existente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: RecyclerResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reciclador no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'documentNumber duplicado',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecyclerDto,
  ): Promise<RecyclerResponseDto> {
    const recycler = await this.updateRecyclerUseCase.execute(id, dto);
    return RecyclerMapper.toResponseDto(recycler);
  }
}
