import { Inject, Injectable } from '@nestjs/common';
import type { SaleEntity } from '../../domain/entities/sale.entity.js';
import { SaleNotFoundException } from '../../domain/exceptions/sale-not-found.exception.js';
import {
  SALE_REPOSITORY,
  type ISaleRepository,
} from '../../domain/interfaces/sale.repository.interface.js';

@Injectable()
export class GetSaleByIdUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(id: number): Promise<SaleEntity> {
    const sale = await this.saleRepository.findById(id);

    if (!sale) {
      throw new SaleNotFoundException(id);
    }

    return sale;
  }
}
