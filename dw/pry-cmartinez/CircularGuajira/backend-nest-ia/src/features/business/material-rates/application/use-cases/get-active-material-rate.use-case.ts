import { Inject, Injectable } from '@nestjs/common';
import type { MaterialRateEntity } from '../../domain/entities/material-rate.entity.js';
import { MaterialRateNotFoundException } from '../../domain/exceptions/material-rate-not-found.exception.js';
import {
  MATERIAL_RATE_REPOSITORY,
  type IMaterialRateRepository,
} from '../../domain/interfaces/material-rate.repository.interface.js';

@Injectable()
export class GetActiveMaterialRateUseCase {
  constructor(
    @Inject(MATERIAL_RATE_REPOSITORY)
    private readonly materialRateRepository: IMaterialRateRepository,
  ) {}

  async execute(materialId: number, date: Date = new Date()): Promise<MaterialRateEntity> {
    const rate = await this.materialRateRepository.findActiveRateByMaterialAndDate(
      materialId,
      date,
    );

    if (!rate) {
      throw new MaterialRateNotFoundException(materialId);
    }

    return rate;
  }
}
