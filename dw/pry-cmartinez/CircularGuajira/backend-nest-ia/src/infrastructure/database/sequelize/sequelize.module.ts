import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { APP_ENV } from '../../../config/environment/env.config.js';
import type { AppEnv } from '../../../config/environment/env.interface.js';
import { buildSequelizeOptions } from './sequelize.factory.js';

export const SEQUELIZE = Symbol('SEQUELIZE');

/**
 * Módulo global de conexión a base de datos. Instancia Sequelize según el
 * dialecto configurado y sincroniza el esquema exclusivamente con
 * `sync({ alter: false })` (verifica/crea tablas faltantes sin alterar ni
 * destruir datos existentes). PROHIBIDO usar `force: true` o `alter: true`.
 */
@Global()
@Module({
  providers: [
    {
      provide: SEQUELIZE,
      inject: [APP_ENV],
      useFactory: async (env: AppEnv): Promise<Sequelize> => {
        const sequelize = new Sequelize(buildSequelizeOptions(env));
        await sequelize.authenticate();
        await sequelize.sync({ alter: false });
        return sequelize;
      },
    },
  ],
  exports: [SEQUELIZE],
})
export class SequelizeDatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async onApplicationShutdown(): Promise<void> {
    await this.sequelize.close();
  }
}
