import { Dialect, type EnvironmentVariables } from './env.validation.js';
import type { DatabaseEnv } from './env.interface.js';

/**
 * Extrae el bloque DB_<MOTOR>_* correspondiente al dialecto activo y lo
 * normaliza a la forma genérica {@link DatabaseEnv}.
 */
export function resolveDatabaseEnv(env: EnvironmentVariables): DatabaseEnv {
  switch (env.DB_DIALECT) {
    case Dialect.MYSQL:
      return {
        host: env.DB_MYSQL_HOST as string,
        port: env.DB_MYSQL_PORT as number,
        username: env.DB_MYSQL_USERNAME as string,
        password: env.DB_MYSQL_PASSWORD as string,
        name: env.DB_MYSQL_NAME as string,
      };
    case Dialect.POSTGRES:
      return {
        host: env.DB_POSTGRES_HOST as string,
        port: env.DB_POSTGRES_PORT as number,
        username: env.DB_POSTGRES_USERNAME as string,
        password: env.DB_POSTGRES_PASSWORD as string,
        name: env.DB_POSTGRES_NAME as string,
      };
    case Dialect.MSSQL:
      return {
        host: env.DB_MSSQL_HOST as string,
        port: env.DB_MSSQL_PORT as number,
        username: env.DB_MSSQL_USERNAME as string,
        password: env.DB_MSSQL_PASSWORD as string,
        name: env.DB_MSSQL_NAME as string,
      };
    case Dialect.ORACLE:
      return {
        host: env.DB_ORACLE_HOST as string,
        port: env.DB_ORACLE_PORT as number,
        username: env.DB_ORACLE_USERNAME as string,
        password: env.DB_ORACLE_PASSWORD as string,
        name: env.DB_ORACLE_NAME as string,
      };
    default:
      // Inalcanzable: DB_DIALECT ya fue validado por class-validator (@IsIn).
      throw new Error(`[Config] DB_DIALECT no soportado: ${String(env.DB_DIALECT)}`);
  }
}
