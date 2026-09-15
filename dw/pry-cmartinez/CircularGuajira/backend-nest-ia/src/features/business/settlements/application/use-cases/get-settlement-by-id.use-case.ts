import { Inject, Injectable } from '@nestjs/common';
import type { SettlementEntity } from '../../domain/entities/settlement.entity.js';
import { SettlementNotFoundException } from '../../domain/exceptions/settlement-not-found.exception.js';
import {
  SETTLEMENT_REPOSITORY,
  type ISettlementRepository,
} from '../../domain/interfaces/settlement.repository.interface.js';

@Injectable()
export class GetSettlementByIdUseCase {
  constructor(
    @Inject(SETTLEMENT_REPOSITORY)
    private readonly settlementRepository: ISettlementRepository,
  ) {}

  async execute(id: number): Promise<SettlementEntity> {
    const settlement = await this.settlementRepository.findById(id);

    if (!settlement) {
      throw new SettlementNotFoundException(id);
    }

    return settlement;
  }
}
