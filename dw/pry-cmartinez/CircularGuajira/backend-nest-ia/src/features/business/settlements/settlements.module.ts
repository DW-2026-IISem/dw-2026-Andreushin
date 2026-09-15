import { Module } from '@nestjs/common';
import { MaterialRatesModule } from '../material-rates/material-rates.module.js';
import { RecyclersModule } from '../recyclers/recyclers.module.js';
import { CreateSettlementUseCase } from './application/use-cases/create-settlement.use-case.js';
import { GetSettlementByIdUseCase } from './application/use-cases/get-settlement-by-id.use-case.js';
import { SETTLEMENT_REPOSITORY } from './domain/interfaces/settlement.repository.interface.js';
import { SettlementRepository } from './infrastructure/persistence/repositories/settlement.repository.js';
import { SettlementsController } from './presentation/http/controllers/settlements.controller.js';

@Module({
  imports: [RecyclersModule, MaterialRatesModule],
  controllers: [SettlementsController],
  providers: [
    { provide: SETTLEMENT_REPOSITORY, useClass: SettlementRepository },
    CreateSettlementUseCase,
    GetSettlementByIdUseCase,
  ],
  exports: [SETTLEMENT_REPOSITORY],
})
export class SettlementsModule {}
