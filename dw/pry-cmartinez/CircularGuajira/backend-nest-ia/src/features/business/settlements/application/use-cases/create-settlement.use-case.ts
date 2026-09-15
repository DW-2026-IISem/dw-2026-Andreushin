import { Inject, Injectable } from '@nestjs/common';
import { RecyclerNotFoundException } from '../../../recyclers/domain/exceptions/recycler-not-found.exception.js';
import {
  RECYCLER_REPOSITORY,
  type IRecyclerRepository,
} from '../../../recyclers/domain/interfaces/recycler.repository.interface.js';
import type { SettlementEntity } from '../../domain/entities/settlement.entity.js';
import { EmptySettlementException } from '../../domain/exceptions/empty-settlement.exception.js';
import { RecyclerInactiveException } from '../../domain/exceptions/recycler-inactive.exception.js';
import {
  SETTLEMENT_REPOSITORY,
  type ISettlementRepository,
} from '../../domain/interfaces/settlement.repository.interface.js';
import type { CreateSettlementDto } from '../dto/create-settlement.dto.js';
import { SettlementMapper } from '../mappers/settlement.mapper.js';

@Injectable()
export class CreateSettlementUseCase {
  constructor(
    @Inject(SETTLEMENT_REPOSITORY)
    private readonly settlementRepository: ISettlementRepository,
    @Inject(RECYCLER_REPOSITORY)
    private readonly recyclerRepository: IRecyclerRepository,
  ) {}

  async execute(dto: CreateSettlementDto): Promise<SettlementEntity> {
    const recycler = await this.recyclerRepository.findById(dto.recyclerId);

    if (!recycler) {
      throw new RecyclerNotFoundException(dto.recyclerId);
    }

    if (!recycler.isActive) {
      throw new RecyclerInactiveException(dto.recyclerId);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new EmptySettlementException();
    }

    return this.settlementRepository.create(SettlementMapper.toCreateData(dto));
  }
}
