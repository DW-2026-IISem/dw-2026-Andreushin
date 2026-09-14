import { Global, Module } from '@nestjs/common';
import { resolveDatabaseEnv } from './db-env.js';
import { validateEnvironment } from './env.validation.js';
import type { AppEnv } from './env.interface.js';

export const APP_ENV = Symbol('APP_ENV');

/**
 * Carga y valida las variables de entorno del proceso. Se invoca desde el
 * factory del provider global, por lo que cualquier variable crítica
 * faltante del dialecto activo lanza inmediatamente durante el arranque
 * de Nest (Fail-Fast), antes de que la app quede escuchando peticiones.
 */
export function loadAppEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const env = validateEnvironment(source);

  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    dbDialect: env.DB_DIALECT,
    database: resolveDatabaseEnv(env),
  };
}

@Global()
@Module({
  providers: [{ provide: APP_ENV, useFactory: loadAppEnv }],
  exports: [APP_ENV],
})
export class EnvironmentConfigModule {}
