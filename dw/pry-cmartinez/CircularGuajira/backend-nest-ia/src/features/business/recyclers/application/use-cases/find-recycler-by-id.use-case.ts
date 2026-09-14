import { Inject, Injectable } from '@nestjs/common';
import type { RecyclerEntity } from '../../domain/entities/recycler.entity.js';
import { RecyclerNotFoundException } from '../../domain/exceptions/recycler-not-found.exception.js';
import {
  RECYCLER_REPOSITORY,
  type IRecyclerRepository,
} from '../../domain/interfaces/recycler.repository.interface.js';

@Injectable()
export class FindRecyclerByIdUseCase {
  constructor(
    @Inject(RECYCLER_REPOSITORY)
    private readonly recyclerRepository: IRecyclerRepository,
  ) {}

  async execute(id: number): Promise<RecyclerEntity> {
    const recycler = await this.recyclerRepository.findById(id);

    if (!recycler) {
      throw new RecyclerNotFoundException(id);
    }

    return recycler;
  }
}
