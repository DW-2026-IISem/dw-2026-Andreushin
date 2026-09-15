import { Inject, Injectable } from '@nestjs/common';
import { MaterialNotFoundException } from '../../../materials/domain/exceptions/material-not-found.exception.js';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../../materials/domain/interfaces/material.repository.interface.js';
import type { MaterialRateEntity } from '../../domain/entities/material-rate.entity.js';
import { MaterialInactiveException } from '../../domain/exceptions/material-inactive.exception.js';
import { MaterialRateOverlapException } from '../../domain/exceptions/material-rate-overlap.exception.js';
import {
  MATERIAL_RATE_REPOSITORY,
  type IMaterialRateRepository,
} from '../../domain/interfaces/material-rate.repository.interface.js';
import type { CreateMaterialRateDto } from '../dto/create-material-rate.dto.js';
import { MaterialRateMapper } from '../mappers/material-rate.mapper.js';

@Injectable()
export class CreateMaterialRateUseCase {
  constructor(
    @Inject(MATERIAL_RATE_REPOSITORY)
    private readonly materialRateRepository: IMaterialRateRepository,
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(dto: CreateMaterialRateDto): Promise<MaterialRateEntity> {
    const material = await this.materialRepository.findById(dto.materialId);

    if (!material) {
      throw new MaterialNotFoundException(dto.materialId);
    }

    if (!material.isActive) {
      throw new MaterialInactiveException(dto.materialId);
    }

    const startDate = new Date(dto.startDate);
    const overlapping = await this.materialRateRepository.findActiveRateByMaterialAndDate(
      dto.materialId,
      startDate,
    );

    if (overlapping) {
      throw new MaterialRateOverlapException(dto.materialId);
    }

    return this.materialRateRepository.create(MaterialRateMapper.toCreateData(dto));
  }
}
