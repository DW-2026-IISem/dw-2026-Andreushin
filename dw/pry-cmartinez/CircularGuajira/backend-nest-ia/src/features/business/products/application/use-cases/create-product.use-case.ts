import { Inject, Injectable } from '@nestjs/common';
import { MaterialNotFoundException } from '../../../materials/domain/exceptions/material-not-found.exception.js';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../../materials/domain/interfaces/material.repository.interface.js';
import type { ProductEntity } from '../../domain/entities/product.entity.js';
import { MaterialInactiveException } from '../../domain/exceptions/material-inactive.exception.js';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product.repository.interface.js';
import type { CreateProductDto } from '../dto/create-product.dto.js';
import { ProductMapper } from '../mappers/product.mapper.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(dto: CreateProductDto): Promise<ProductEntity> {
    const material = await this.materialRepository.findById(dto.materialId);

    if (!material) {
      throw new MaterialNotFoundException(dto.materialId);
    }

    if (!material.isActive) {
      throw new MaterialInactiveException(dto.materialId);
    }

    return this.productRepository.create(ProductMapper.toCreateData(dto));
  }
}
