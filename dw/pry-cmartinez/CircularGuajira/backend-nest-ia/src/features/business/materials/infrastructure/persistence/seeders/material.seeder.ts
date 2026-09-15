import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MATERIAL_REPOSITORY,
  type CreateMaterialData,
  type IMaterialRepository,
} from '../../../domain/interfaces/material.repository.interface.js';

const MATERIAL_SEEDS: CreateMaterialData[] = [
  { name: 'PET', description: 'Tereftalato de polietileno (botellas plásticas)', unitOfMeasure: 'KG' },
  { name: 'Cartón', description: 'Cartón y papel corrugado', unitOfMeasure: 'KG' },
  { name: 'Aluminio', description: 'Latas y perfiles de aluminio', unitOfMeasure: 'KG' },
  { name: 'Vidrio', description: 'Envases y fragmentos de vidrio', unitOfMeasure: 'KG' },
  { name: 'Chatarra', description: 'Chatarra metálica ferrosa y no ferrosa', unitOfMeasure: 'KG' },
];

/**
 * Seeder idempotente del feature `materials`: verifica por `name` antes de
 * insertar, por lo que puede ejecutarse múltiples veces sin duplicar
 * registros.
 */
@Injectable()
export class MaterialSeeder {
  private readonly logger = new Logger(MaterialSeeder.name);

  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async seed(): Promise<void> {
    for (const seed of MATERIAL_SEEDS) {
      const existing = await this.materialRepository.findByName(seed.name);

      if (existing) {
        this.logger.log(`Material ya existe, se omite: ${seed.name}`);
        continue;
      }

      await this.materialRepository.create(seed);
      this.logger.log(`Material sembrado: ${seed.name}`);
    }
  }
}
