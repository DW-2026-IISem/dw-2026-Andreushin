import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../../app.module.js';
import { MaterialSeeder } from './material.seeder.js';

/**
 * Runner standalone para poblar `materials` de forma manual/evidencial
 * (`npm run seed:materials`). El orquestador global de seeders
 * (Recyclers -> Materials -> MaterialRates) se implementa en ISS-07.
 */
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seeder = app.get(MaterialSeeder);
    await seeder.seed();
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    console.log('[MaterialSeeder] Completado');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[MaterialSeeder] Error al sembrar materiales');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
