import { Inject, Injectable } from '@nestjs/common';
import type { RecyclerEntity } from '../../domain/entities/recycler.entity.js';
import { RecyclerAlreadyExistsException } from '../../domain/exceptions/recycler-already-exists.exception.js';
import {
  RECYCLER_REPOSITORY,
  type IRecyclerRepository,
} from '../../domain/interfaces/recycler.repository.interface.js';
import type { CreateRecyclerDto } from '../dto/create-recycler.dto.js';
import { RecyclerMapper } from '../mappers/recycler.mapper.js';

@Injectable()
export class CreateRecyclerUseCase {
  constructor(
    @Inject(RECYCLER_REPOSITORY)
    private readonly recyclerRepository: IRecyclerRepository,
  ) {}

  async execute(dto: CreateRecyclerDto): Promise<RecyclerEntity> {
    const existing = await this.recyclerRepository.findByDocumentNumber(
      dto.documentNumber,
    );

    if (existing) {
      throw new RecyclerAlreadyExistsException(dto.documentNumber);
    }

    return this.recyclerRepository.create(RecyclerMapper.toCreateData(dto));
  }
}
