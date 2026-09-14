import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  RECYCLER_REPOSITORY,
  type CreateRecyclerData,
  type IRecyclerRepository,
} from '../../../domain/interfaces/recycler.repository.interface.js';

const RECYCLER_SEEDS: CreateRecyclerData[] = [
  {
    documentNumber: '900123456',
    name: 'Asociación Recicladores Uribia',
    phone: '3001234567',
    email: 'contacto@recicladoresuribia.co',
    address: 'Uribia, La Guajira',
  },
  {
    documentNumber: '900654321',
    name: 'Cooperativa Recicladores Riohacha',
    phone: '3007654321',
    email: 'contacto@recicladoresriohacha.co',
    address: 'Riohacha, La Guajira',
  },
];

/**
 * Seeder idempotente del feature `recyclers`: verifica por `documentNumber`
 * antes de insertar, por lo que puede ejecutarse múltiples veces sin
 * duplicar registros.
 */
@Injectable()
export class RecyclerSeeder {
  private readonly logger = new Logger(RecyclerSeeder.name);

  constructor(
    @Inject(RECYCLER_REPOSITORY)
    private readonly recyclerRepository: IRecyclerRepository,
  ) {}

  async seed(): Promise<void> {
    for (const seed of RECYCLER_SEEDS) {
      const existing = await this.recyclerRepository.findByDocumentNumber(
        seed.documentNumber,
      );

      if (existing) {
        this.logger.log(`Reciclador ya existe, se omite: ${seed.documentNumber}`);
        continue;
      }

      await this.recyclerRepository.create(seed);
      this.logger.log(`Reciclador sembrado: ${seed.name} (${seed.documentNumber})`);
    }
  }
}
