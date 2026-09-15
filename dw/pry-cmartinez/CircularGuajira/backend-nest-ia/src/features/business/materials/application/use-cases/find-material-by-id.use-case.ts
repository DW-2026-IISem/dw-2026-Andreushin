import { Inject, Injectable } from '@nestjs/common';
import type { MaterialEntity } from '../../domain/entities/material.entity.js';
import { MaterialNotFoundException } from '../../domain/exceptions/material-not-found.exception.js';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../domain/interfaces/material.repository.interface.js';

@Injectable()
export class FindMaterialByIdUseCase {
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(id: number): Promise<MaterialEntity> {
    const material = await this.materialRepository.findById(id);

    if (!material) {
      throw new MaterialNotFoundException(id);
    }

    return material;
  }
}
