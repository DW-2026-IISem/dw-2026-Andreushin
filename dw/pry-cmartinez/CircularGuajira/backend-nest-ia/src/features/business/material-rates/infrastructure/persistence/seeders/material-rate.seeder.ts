import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../../../materials/domain/interfaces/material.repository.interface.js';
import {
  MATERIAL_RATE_REPOSITORY,
  type IMaterialRateRepository,
} from '../../../domain/interfaces/material-rate.repository.interface.js';

const BASE_RATES: Record<string, number> = {
  PET: 1200,
  Cartón: 800,
  Aluminio: 3500,
  Vidrio: 400,
  Chatarra: 1000,
};

/**
 * Seeder idempotente del feature `material-rates`: por cada material base
 * de ISS-04, verifica si ya existe una tarifa activa vigente antes de
 * insertar, por lo que puede ejecutarse múltiples veces sin duplicar.
 */
@Injectable()
export class MaterialRateSeeder {
  private readonly logger = new Logger(MaterialRateSeeder.name);

  constructor(
    @Inject(MATERIAL_RATE_REPOSITORY)
    private readonly materialRateRepository: IMaterialRateRepository,
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async seed(): Promise<void> {
    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);

    for (const [materialName, pricePerKg] of Object.entries(BASE_RATES)) {
      const material = await this.materialRepository.findByName(materialName);

      if (!material) {
        this.logger.warn(`Material "${materialName}" no existe, se omite su tarifa`);
        continue;
      }

      const existing = await this.materialRateRepository.findActiveRateByMaterialAndDate(
        material.id,
        now,
      );

      if (existing) {
        this.logger.log(`Tarifa ya existe, se omite: ${materialName}`);
        continue;
      }

      await this.materialRateRepository.create({
        materialId: material.id,
        pricePerKg,
        minStockKg: 0,
        stockKg: 0,
        startDate,
        endDate: null,
        isActive: true,
      });
      this.logger.log(`Tarifa sembrada: ${materialName} ($${pricePerKg}/kg)`);
    }
  }
}
