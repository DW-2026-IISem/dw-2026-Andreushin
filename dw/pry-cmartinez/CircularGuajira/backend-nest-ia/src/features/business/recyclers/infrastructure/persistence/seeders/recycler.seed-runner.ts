import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../../app.module.js';
import { RecyclerSeeder } from './recycler.seeder.js';

/**
 * Runner standalone para poblar `recyclers` de forma manual/evidencial
 * (`npm run seed:recyclers`). El orquestador global de seeders
 * (Recyclers -> Materials -> MaterialRates) se implementa en ISS-07.
 */
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seeder = app.get(RecyclerSeeder);
    await seeder.seed();
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    console.log('[RecyclerSeeder] Completado');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[RecyclerSeeder] Error al sembrar recicladores');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
