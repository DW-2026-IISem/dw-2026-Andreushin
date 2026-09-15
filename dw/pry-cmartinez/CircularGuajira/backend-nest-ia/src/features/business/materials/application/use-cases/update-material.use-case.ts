import { Inject, Injectable } from '@nestjs/common';
import type { MaterialEntity } from '../../domain/entities/material.entity.js';
import { MaterialAlreadyExistsException } from '../../domain/exceptions/material-already-exists.exception.js';
import { MaterialNotFoundException } from '../../domain/exceptions/material-not-found.exception.js';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../domain/interfaces/material.repository.interface.js';
import type { UpdateMaterialDto } from '../dto/update-material.dto.js';

@Injectable()
export class UpdateMaterialUseCase {
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(id: number, dto: UpdateMaterialDto): Promise<MaterialEntity> {
    const existing = await this.materialRepository.findById(id);

    if (!existing) {
      throw new MaterialNotFoundException(id);
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.materialRepository.findByName(dto.name);

      if (duplicate) {
        throw new MaterialAlreadyExistsException(dto.name);
      }
    }

    return this.materialRepository.update(id, dto);
  }
}
