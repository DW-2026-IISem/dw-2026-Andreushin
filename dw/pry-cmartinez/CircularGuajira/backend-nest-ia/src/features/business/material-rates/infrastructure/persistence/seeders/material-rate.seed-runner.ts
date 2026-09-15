import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../../app.module.js';
import { MaterialRateSeeder } from './material-rate.seeder.js';

/**
 * Runner standalone para poblar `material-rates` de forma manual/evidencial
 * (`npm run seed:material-rates`). El orquestador global de seeders
 * (Recyclers -> Materials -> MaterialRates) se implementa en ISS-07.
 */
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seeder = app.get(MaterialRateSeeder);
    await seeder.seed();
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    console.log('[MaterialRateSeeder] Completado');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[MaterialRateSeeder] Error al sembrar tarifas');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
