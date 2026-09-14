import { Type, plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';

export enum Dialect {
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
  MSSQL = 'mssql',
  ORACLE = 'oracle',
}

export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Variables de entorno crudas del proceso. Los bloques DB_<MOTOR>_* son
 * opcionales a nivel de clase y se vuelven obligatorios únicamente cuando
 * DB_DIALECT selecciona ese motor (ver @ValidateIf), lo que permite la
 * validación Fail-Fast del motor activo sin exigir los otros tres.
 */
export class EnvironmentVariables {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3002;

  @IsOptional()
  @IsIn(Object.values(NodeEnv))
  NODE_ENV: NodeEnv = NodeEnv.DEVELOPMENT;

  @IsIn(Object.values(Dialect), {
    message: `DB_DIALECT es requerida y debe ser una de: ${Object.values(Dialect).join(', ')}`,
  })
  DB_DIALECT: Dialect;

  // ---- MySQL ----
  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MYSQL)
  @IsNotEmpty({ message: 'DB_MYSQL_HOST es requerida cuando DB_DIALECT=mysql' })
  @IsString()
  DB_MYSQL_HOST?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MYSQL)
  @Type(() => Number)
  @IsInt({ message: 'DB_MYSQL_PORT es requerida cuando DB_DIALECT=mysql' })
  @Min(1)
  @Max(65535)
  DB_MYSQL_PORT?: number;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MYSQL)
  @IsNotEmpty({ message: 'DB_MYSQL_USERNAME es requerida cuando DB_DIALECT=mysql' })
  @IsString()
  DB_MYSQL_USERNAME?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MYSQL)
  @IsNotEmpty({ message: 'DB_MYSQL_PASSWORD es requerida cuando DB_DIALECT=mysql' })
  @IsString()
  DB_MYSQL_PASSWORD?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MYSQL)
  @IsNotEmpty({ message: 'DB_MYSQL_NAME es requerida cuando DB_DIALECT=mysql' })
  @IsString()
  DB_MYSQL_NAME?: string;

  // ---- PostgreSQL ----
  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.POSTGRES)
  @IsNotEmpty({ message: 'DB_POSTGRES_HOST es requerida cuando DB_DIALECT=postgres' })
  @IsString()
  DB_POSTGRES_HOST?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.POSTGRES)
  @Type(() => Number)
  @IsInt({ message: 'DB_POSTGRES_PORT es requerida cuando DB_DIALECT=postgres' })
  @Min(1)
  @Max(65535)
  DB_POSTGRES_PORT?: number;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.POSTGRES)
  @IsNotEmpty({ message: 'DB_POSTGRES_USERNAME es requerida cuando DB_DIALECT=postgres' })
  @IsString()
  DB_POSTGRES_USERNAME?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.POSTGRES)
  @IsNotEmpty({ message: 'DB_POSTGRES_PASSWORD es requerida cuando DB_DIALECT=postgres' })
  @IsString()
  DB_POSTGRES_PASSWORD?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.POSTGRES)
  @IsNotEmpty({ message: 'DB_POSTGRES_NAME es requerida cuando DB_DIALECT=postgres' })
  @IsString()
  DB_POSTGRES_NAME?: string;

  // ---- SQL Server ----
  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MSSQL)
  @IsNotEmpty({ message: 'DB_MSSQL_HOST es requerida cuando DB_DIALECT=mssql' })
  @IsString()
  DB_MSSQL_HOST?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MSSQL)
  @Type(() => Number)
  @IsInt({ message: 'DB_MSSQL_PORT es requerida cuando DB_DIALECT=mssql' })
  @Min(1)
  @Max(65535)
  DB_MSSQL_PORT?: number;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MSSQL)
  @IsNotEmpty({ message: 'DB_MSSQL_USERNAME es requerida cuando DB_DIALECT=mssql' })
  @IsString()
  DB_MSSQL_USERNAME?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MSSQL)
  @IsNotEmpty({ message: 'DB_MSSQL_PASSWORD es requerida cuando DB_DIALECT=mssql' })
  @IsString()
  DB_MSSQL_PASSWORD?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.MSSQL)
  @IsNotEmpty({ message: 'DB_MSSQL_NAME es requerida cuando DB_DIALECT=mssql' })
  @IsString()
  DB_MSSQL_NAME?: string;

  // ---- Oracle ----
  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.ORACLE)
  @IsNotEmpty({ message: 'DB_ORACLE_HOST es requerida cuando DB_DIALECT=oracle' })
  @IsString()
  DB_ORACLE_HOST?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.ORACLE)
  @Type(() => Number)
  @IsInt({ message: 'DB_ORACLE_PORT es requerida cuando DB_DIALECT=oracle' })
  @Min(1)
  @Max(65535)
  DB_ORACLE_PORT?: number;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.ORACLE)
  @IsNotEmpty({ message: 'DB_ORACLE_USERNAME es requerida cuando DB_DIALECT=oracle' })
  @IsString()
  DB_ORACLE_USERNAME?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.ORACLE)
  @IsNotEmpty({ message: 'DB_ORACLE_PASSWORD es requerida cuando DB_DIALECT=oracle' })
  @IsString()
  DB_ORACLE_PASSWORD?: string;

  @ValidateIf((env: EnvironmentVariables) => env.DB_DIALECT === Dialect.ORACLE)
  @IsNotEmpty({ message: 'DB_ORACLE_NAME es requerida cuando DB_DIALECT=oracle' })
  @IsString()
  DB_ORACLE_NAME?: string;
}

/**
 * Valida las variables de entorno crudas y falla rápido (Fail-Fast) con un
 * mensaje claro si falta alguna variable crítica del dialecto activo.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join(' | ');
    throw new Error(
      `[Config] Variables de entorno inválidas o faltantes: ${messages}`,
    );
  }

  return validatedConfig;
}
