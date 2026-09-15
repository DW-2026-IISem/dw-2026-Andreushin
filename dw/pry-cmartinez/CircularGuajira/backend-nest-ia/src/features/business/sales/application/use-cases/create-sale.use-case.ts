import { Inject, Injectable } from '@nestjs/common';
import { RecyclerNotFoundException } from '../../../recyclers/domain/exceptions/recycler-not-found.exception.js';
import {
  RECYCLER_REPOSITORY,
  type IRecyclerRepository,
} from '../../../recyclers/domain/interfaces/recycler.repository.interface.js';
import type { SaleEntity } from '../../domain/entities/sale.entity.js';
import { EmptySaleException } from '../../domain/exceptions/empty-sale.exception.js';
import {
  SALE_REPOSITORY,
  type ISaleRepository,
} from '../../domain/interfaces/sale.repository.interface.js';
import type { CreateSaleDto } from '../dto/create-sale.dto.js';
import { SaleMapper } from '../mappers/sale.mapper.js';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepository: ISaleRepository,
    @Inject(RECYCLER_REPOSITORY)
    private readonly recyclerRepository: IRecyclerRepository,
  ) {}

  async execute(dto: CreateSaleDto): Promise<SaleEntity> {
    const client = await this.recyclerRepository.findById(dto.clientId);

    if (!client) {
      throw new RecyclerNotFoundException(dto.clientId);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new EmptySaleException();
    }

    return this.saleRepository.create(SaleMapper.toCreateData(dto));
  }
}
