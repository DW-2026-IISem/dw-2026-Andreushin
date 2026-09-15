import { Inject, Injectable } from '@nestjs/common';
import type { MaterialEntity } from '../../domain/entities/material.entity.js';
import { MaterialAlreadyExistsException } from '../../domain/exceptions/material-already-exists.exception.js';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../domain/interfaces/material.repository.interface.js';
import type { CreateMaterialDto } from '../dto/create-material.dto.js';
import { MaterialMapper } from '../mappers/material.mapper.js';

@Injectable()
export class CreateMaterialUseCase {
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(dto: CreateMaterialDto): Promise<MaterialEntity> {
    const existing = await this.materialRepository.findByName(dto.name);

    if (existing) {
      throw new MaterialAlreadyExistsException(dto.name);
    }

    return this.materialRepository.create(MaterialMapper.toCreateData(dto));
  }
}
