import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module.js';
import { MaterialRateSeeder } from '../../../features/business/material-rates/infrastructure/persistence/seeders/material-rate.seeder.js';
import { MaterialSeeder } from '../../../features/business/materials/infrastructure/persistence/seeders/material.seeder.js';
import { RecyclerSeeder } from '../../../features/business/recyclers/infrastructure/persistence/seeders/recycler.seeder.js';

/**
 * Orquestador global de seeders (`npm run seed`): ejecuta, en orden estricto
 * de dependencias, Recyclers -> Materials -> MaterialRates. Cada seeder es
 * idempotente (verifica existencia antes de insertar), por lo que correr
 * este script 2 o más veces deja exactamente los mismos registros sin
 * duplicar nada. `settlements` no se siembra aquí: se genera dinámicamente
 * durante la demo (ver README).
 */
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    await app.get(RecyclerSeeder).seed();
    await app.get(MaterialSeeder).seed();
    await app.get(MaterialRateSeeder).seed();
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    console.log('[SeedersRunner] Completado: Recyclers -> Materials -> MaterialRates');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[SeedersRunner] Error al ejecutar la siembra global');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
