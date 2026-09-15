import { Inject, Injectable } from '@nestjs/common';
import type { ProductEntity } from '../../domain/entities/product.entity.js';
import { ProductNotFoundException } from '../../domain/exceptions/product-not-found.exception.js';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product.repository.interface.js';

@Injectable()
export class FindProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new ProductNotFoundException(id);
    }

    return product;
  }
}
