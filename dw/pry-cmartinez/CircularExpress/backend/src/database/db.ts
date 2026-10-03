import { Sequelize, Dialect } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

type DbDialect = "mysql" | "postgres" | "mssql" | "oracle";

const SUPPORTED_DIALECTS: DbDialect[] = ["mysql", "postgres", "mssql", "oracle"];

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

// Fail-fast: DB_DIALECT must be one of the supported engines.
function getDialect(): DbDialect {
  const raw = (process.env.DB_DIALECT || "").toLowerCase();
  if (!SUPPORTED_DIALECTS.includes(raw as DbDialect)) {
    throw new Error(
      `Invalid or missing DB_DIALECT ("${raw}"). Allowed values: ${SUPPORTED_DIALECTS.join(", ")}`
    );
  }
  return raw as DbDialect;
}

// Fail-fast: only the DB_<ENGINE>_* block of the active engine is required.
function getConfig(dialect: DbDialect): DatabaseConfig {
  const prefix = `DB_${dialect.toUpperCase()}`;
  const keys = ["HOST", "PORT", "USERNAME", "PASSWORD", "NAME"] as const;
  const values = {} as Record<(typeof keys)[number], string>;

  for (const key of keys) {
    const envKey = `${prefix}_${key}`;
    const value = process.env[envKey];
    if (!value) {
      throw new Error(`Missing required environment variable: ${envKey}`);
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

const selectedEngine = getDialect();
const selectedConfig = getConfig(selectedEngine);

console.log(`🔌 Connecting to CircularGuajira database: ${selectedEngine.toUpperCase()}`);

export const sequelize = new Sequelize(
  selectedConfig.database,
  selectedConfig.username,
  selectedConfig.password,
  {
    host: selectedConfig.host,
    port: selectedConfig.port,
    dialect: selectedEngine as Dialect,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Never exposes the password.
export const getDatabaseInfo = () => {
  return {
    engine: selectedEngine,
    host: selectedConfig.host,
    port: selectedConfig.port,
    database: selectedConfig.database,
    connectionString: `${selectedEngine}://${selectedConfig.username}@${selectedConfig.host}:${selectedConfig.port}/${selectedConfig.database}`,
  };
};

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Connected to ${selectedEngine.toUpperCase()}`);
    return true;
  } catch (error) {
    console.error(`❌ Connection error on ${selectedEngine.toUpperCase()}:`, error);
    return false;
  }
};
