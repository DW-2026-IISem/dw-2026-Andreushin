import { Inject, Injectable } from '@nestjs/common';
import type { ProductEntity } from '../../domain/entities/product.entity.js';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product.repository.interface.js';
import type { FindAllProductsQueryDto } from '../dto/find-all-products-query.dto.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedProducts {
  items: ProductEntity[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: FindAllProductsQueryDto): Promise<PaginatedProducts> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const { items, total } = await this.productRepository.findAll({
      page,
      limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }
}
