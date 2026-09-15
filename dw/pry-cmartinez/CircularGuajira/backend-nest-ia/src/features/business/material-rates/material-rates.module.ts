import { Module } from '@nestjs/common';
import { MaterialsModule } from '../materials/materials.module.js';
import { CreateMaterialRateUseCase } from './application/use-cases/create-material-rate.use-case.js';
import { FindAllMaterialRatesUseCase } from './application/use-cases/find-all-material-rates.use-case.js';
import { FindMaterialRateByIdUseCase } from './application/use-cases/find-material-rate-by-id.use-case.js';
import { GetActiveMaterialRateUseCase } from './application/use-cases/get-active-material-rate.use-case.js';
import { MATERIAL_RATE_REPOSITORY } from './domain/interfaces/material-rate.repository.interface.js';
import { MaterialRateRepository } from './infrastructure/persistence/repositories/material-rate.repository.js';
import { MaterialRateSeeder } from './infrastructure/persistence/seeders/material-rate.seeder.js';
import { MaterialRatesController } from './presentation/http/controllers/material-rates.controller.js';

@Module({
  imports: [MaterialsModule],
  controllers: [MaterialRatesController],
  providers: [
    { provide: MATERIAL_RATE_REPOSITORY, useClass: MaterialRateRepository },
    CreateMaterialRateUseCase,
    GetActiveMaterialRateUseCase,
    FindAllMaterialRatesUseCase,
    FindMaterialRateByIdUseCase,
    MaterialRateSeeder,
  ],
  exports: [MATERIAL_RATE_REPOSITORY, MaterialRateSeeder],
})
export class MaterialRatesModule {}
