import { Inject, Injectable } from '@nestjs/common';
import { MaterialNotFoundException } from '../../../materials/domain/exceptions/material-not-found.exception.js';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../../materials/domain/interfaces/material.repository.interface.js';
import type { ProductEntity } from '../../domain/entities/product.entity.js';
import { MaterialInactiveException } from '../../domain/exceptions/material-inactive.exception.js';
import { ProductNotFoundException } from '../../domain/exceptions/product-not-found.exception.js';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product.repository.interface.js';
import type { UpdateProductDto } from '../dto/update-product.dto.js';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(id: number, dto: UpdateProductDto): Promise<ProductEntity> {
    const existing = await this.productRepository.findById(id);

    if (!existing) {
      throw new ProductNotFoundException(id);
    }

    if (dto.materialId && dto.materialId !== existing.materialId) {
      const material = await this.materialRepository.findById(dto.materialId);

      if (!material) {
        throw new MaterialNotFoundException(dto.materialId);
      }

      if (!material.isActive) {
        throw new MaterialInactiveException(dto.materialId);
      }
    }

    return this.productRepository.update(id, dto);
  }
}
