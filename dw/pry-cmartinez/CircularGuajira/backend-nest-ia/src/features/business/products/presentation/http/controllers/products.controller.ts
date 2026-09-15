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
import { CreateProductDto } from '../../../application/dto/create-product.dto.js';
import { FindAllProductsQueryDto } from '../../../application/dto/find-all-products-query.dto.js';
import { ProductResponseDto } from '../../../application/dto/product-response.dto.js';
import { UpdateProductDto } from '../../../application/dto/update-product.dto.js';
import { ProductMapper } from '../../../application/mappers/product.mapper.js';
import { CreateProductUseCase } from '../../../application/use-cases/create-product.use-case.js';
import {
  FindAllProductsUseCase,
  type PaginatedProducts,
} from '../../../application/use-cases/find-all-products.use-case.js';
import { FindProductByIdUseCase } from '../../../application/use-cases/find-product-by-id.use-case.js';
import { UpdateProductUseCase } from '../../../application/use-cases/update-product.use-case.js';

interface PaginatedProductsResponse {
  items: ProductResponseDto[];
  meta: PaginatedProducts['meta'];
}

/**
 * Controlador HTTP del feature `products`. Delega toda la lógica a los
 * casos de uso de aplicación; no contiene reglas de negocio ni persistencia.
 */
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo producto' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ProductResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'DTO inválido' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'materialId no existe',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'material inactivo',
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.createProductUseCase.execute(dto);
    return ProductMapper.toResponseDto(product);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos de forma paginada' })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(
    @Query() query: FindAllProductsQueryDto,
  ): Promise<PaginatedProductsResponse> {
    const result = await this.findAllProductsUseCase.execute(query);

    return {
      items: result.items.map((item) => ProductMapper.toResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: ProductResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto no encontrado',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    const product = await this.findProductByIdUseCase.execute(id);
    return ProductMapper.toResponseDto(product);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto existente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: ProductResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto o material no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'material inactivo',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.updateProductUseCase.execute(id, dto);
    return ProductMapper.toResponseDto(product);
  }
}
