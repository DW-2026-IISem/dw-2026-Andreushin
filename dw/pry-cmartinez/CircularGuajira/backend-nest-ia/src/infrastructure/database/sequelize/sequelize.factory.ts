import type { Dialect as SequelizeDialect } from 'sequelize';
import type { SequelizeOptions } from 'sequelize-typescript';
import type { AppEnv } from '../../../config/environment/env.interface.js';
import { NodeEnv } from '../../../config/environment/env.validation.js';

/**
 * Construye las opciones de conexión de Sequelize para el dialecto activo
 * (`mysql`, `postgres`, `mssql` u `oracle`) a partir de la configuración de
 * entorno ya validada. No se registran modelos aquí: cada feature de
 * negocio los añade a su propio módulo de infraestructura.
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
    models: [],
    logging: nodeEnv === NodeEnv.PRODUCTION ? false : console.log,
  };
}
