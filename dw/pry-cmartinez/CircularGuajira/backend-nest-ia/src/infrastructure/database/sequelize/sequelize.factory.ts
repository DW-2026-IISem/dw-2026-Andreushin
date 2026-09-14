import type { Dialect as SequelizeDialect } from 'sequelize';
import type { SequelizeOptions } from 'sequelize-typescript';
import type { AppEnv } from '../../../config/environment/env.interface.js';
import { NodeEnv } from '../../../config/environment/env.validation.js';
import { getRegisteredSequelizeModels } from './sequelize-model.registry.js';

/**
 * Construye las opciones de conexión de Sequelize para el dialecto activo
 * (`mysql`, `postgres`, `mssql` u `oracle`) a partir de la configuración de
 * entorno ya validada. Los modelos se toman del registro global
 * (`sequelize-model.registry.ts`): cada feature de negocio se registra a sí
 * misma como efecto secundario de importar su propio `.model.ts`.
 */
export function buildSequelizeOptions(env: AppEnv): SequelizeOptions {
  const { database, dbDialect, nodeEnv } = env;

  return {
    dialect: dbDialect as unknown as SequelizeDialect,
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.name,
    models: getRegisteredSequelizeModels(),
    logging: nodeEnv === NodeEnv.PRODUCTION ? false : console.log,
  };
}
