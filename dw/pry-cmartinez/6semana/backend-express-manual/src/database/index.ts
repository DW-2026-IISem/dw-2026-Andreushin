import dotenv from "dotenv";
import { Sequelize, Dialect } from "sequelize";

dotenv.config();

type DbDialect = "mysql" | "postgres" | "mssql" | "oracle";

const SUPPORTED_DIALECTS: DbDialect[] = ["mysql", "postgres", "mssql", "oracle"];

interface DbCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function getDialect(): DbDialect {
  const raw = (process.env.DB_DIALECT || "").toLowerCase();

  if (!SUPPORTED_DIALECTS.includes(raw as DbDialect)) {
    throw new Error(
      `DB_DIALECT invalido o no definido ("${raw}"). Valores permitidos: ${SUPPORTED_DIALECTS.join(", ")}`
    );
  }

  return raw as DbDialect;
}

function getCredentials(dialect: DbDialect): DbCredentials {
  const prefix = `DB_${dialect.toUpperCase()}`;
  const keys = ["HOST", "PORT", "USERNAME", "PASSWORD", "NAME"] as const;
  const values: Record<(typeof keys)[number], string> = {} as Record<(typeof keys)[number], string>;

  for (const key of keys) {
    const envKey = `${prefix}_${key}`;
    const value = process.env[envKey];

    if (!value) {
      throw new Error(`Falta la variable de entorno requerida: ${envKey}`);
    }

    values[key] = value;
  }

  return {
    host: values.HOST,
    port: Number(values.PORT),
    username: values.USERNAME,
    password: values.PASSWORD,
    database: values.NAME,
  };
}

let instance: Sequelize | null = null;

// Se construye de forma perezosa: las variables de entorno (dotenv.config())
// deben estar cargadas antes de leer DB_DIALECT y las credenciales.
export function getSequelize(): Sequelize {
  if (!instance) {
    const dialect = getDialect();
    const credentials = getCredentials(dialect);

    instance = new Sequelize(credentials.database, credentials.username, credentials.password, {
      host: credentials.host,
      port: credentials.port,
      dialect: dialect as Dialect,
      logging: process.env.NODE_ENV === "development" ? console.log : false,
    });
  }

  return instance;
}

export async function connectDB(): Promise<void> {
  const sequelize = getSequelize();
  await sequelize.authenticate();
  console.log(`✅ Conexión a la base de datos "${sequelize.getDatabaseName()}" (${sequelize.getDialect()}) establecida correctamente.`);
}
