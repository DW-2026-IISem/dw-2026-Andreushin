import { Inject, Injectable } from '@nestjs/common';
import type { RecyclerEntity } from '../../domain/entities/recycler.entity.js';
import { RecyclerAlreadyExistsException } from '../../domain/exceptions/recycler-already-exists.exception.js';
import { RecyclerNotFoundException } from '../../domain/exceptions/recycler-not-found.exception.js';
import {
  RECYCLER_REPOSITORY,
  type IRecyclerRepository,
} from '../../domain/interfaces/recycler.repository.interface.js';
import type { UpdateRecyclerDto } from '../dto/update-recycler.dto.js';

@Injectable()
export class UpdateRecyclerUseCase {
  constructor(
    @Inject(RECYCLER_REPOSITORY)
    private readonly recyclerRepository: IRecyclerRepository,
  ) {}

  async execute(id: number, dto: UpdateRecyclerDto): Promise<RecyclerEntity> {
    const existing = await this.recyclerRepository.findById(id);

    if (!existing) {
      throw new RecyclerNotFoundException(id);
    }

    if (dto.documentNumber && dto.documentNumber !== existing.documentNumber) {
      const duplicate = await this.recyclerRepository.findByDocumentNumber(
        dto.documentNumber,
      );

      if (duplicate) {
        throw new RecyclerAlreadyExistsException(dto.documentNumber);
      }
    }

    return this.recyclerRepository.update(id, dto);
  }
}
