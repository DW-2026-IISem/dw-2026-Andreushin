import { Module } from '@nestjs/common';
import { CreateRecyclerUseCase } from './application/use-cases/create-recycler.use-case.js';
import { FindAllRecyclersUseCase } from './application/use-cases/find-all-recyclers.use-case.js';
import { FindRecyclerByIdUseCase } from './application/use-cases/find-recycler-by-id.use-case.js';
import { UpdateRecyclerUseCase } from './application/use-cases/update-recycler.use-case.js';
import { RECYCLER_REPOSITORY } from './domain/interfaces/recycler.repository.interface.js';
import { RecyclerRepository } from './infrastructure/persistence/repositories/recycler.repository.js';
import { RecyclerSeeder } from './infrastructure/persistence/seeders/recycler.seeder.js';
import { RecyclersController } from './presentation/http/controllers/recyclers.controller.js';

@Module({
  controllers: [RecyclersController],
  providers: [
    { provide: RECYCLER_REPOSITORY, useClass: RecyclerRepository },
    CreateRecyclerUseCase,
    FindAllRecyclersUseCase,
    FindRecyclerByIdUseCase,
    UpdateRecyclerUseCase,
    RecyclerSeeder,
  ],
  exports: [RECYCLER_REPOSITORY, RecyclerSeeder],
})
export class RecyclersModule {}
