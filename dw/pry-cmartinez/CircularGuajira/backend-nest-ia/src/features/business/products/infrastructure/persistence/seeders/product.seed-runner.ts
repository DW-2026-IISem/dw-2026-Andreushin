import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../../app.module.js';
import { ProductSeeder } from './product.seeder.js';

/**
 * Runner standalone para poblar `products` de forma manual/evidencial
 * (`npm run seed:products`). El orquestador global de seeders
 * (Recyclers -> Materials -> Products) se implementa en ISS-07.
 */
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seeder = app.get(ProductSeeder);
    await seeder.seed();
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    console.log('[ProductSeeder] Completado');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[ProductSeeder] Error al sembrar productos');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
