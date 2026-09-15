import { Module } from '@nestjs/common';
import { CreateMaterialUseCase } from './application/use-cases/create-material.use-case.js';
import { FindAllMaterialsUseCase } from './application/use-cases/find-all-materials.use-case.js';
import { FindMaterialByIdUseCase } from './application/use-cases/find-material-by-id.use-case.js';
import { UpdateMaterialUseCase } from './application/use-cases/update-material.use-case.js';
import { MATERIAL_REPOSITORY } from './domain/interfaces/material.repository.interface.js';
import { MaterialRepository } from './infrastructure/persistence/repositories/material.repository.js';
import { MaterialSeeder } from './infrastructure/persistence/seeders/material.seeder.js';
import { MaterialsController } from './presentation/http/controllers/materials.controller.js';

@Module({
  controllers: [MaterialsController],
  providers: [
    { provide: MATERIAL_REPOSITORY, useClass: MaterialRepository },
    CreateMaterialUseCase,
    FindAllMaterialsUseCase,
    FindMaterialByIdUseCase,
    UpdateMaterialUseCase,
    MaterialSeeder,
  ],
  exports: [MATERIAL_REPOSITORY, MaterialSeeder],
})
export class MaterialsModule {}
