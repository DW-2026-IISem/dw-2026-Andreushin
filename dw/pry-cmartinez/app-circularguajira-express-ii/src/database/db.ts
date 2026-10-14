import { Dialect, Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

interface DatabaseConfig {
  dialect: Dialect;
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
}

const dbConfigurations: Record<string, DatabaseConfig> = {
  mysql: {
    dialect: "mysql",
    host: process.env.MYSQL_HOST || "localhost",
    username: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_NAME || "test",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
  },
  postgres: {
    dialect: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "",
    database: process.env.POSTGRES_NAME || "test",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
  },
  mssql: {
    dialect: "mssql",
    host: process.env.MSSQL_HOST || "localhost",
    username: process.env.MSSQL_USER || "sa",
    password: process.env.MSSQL_PASSWORD || "",
    database: process.env.MSSQL_NAME || "test",
    port: parseInt(process.env.MSSQL_PORT || "1433"),
  },
  oracle: {
    dialect: "oracle",
    host: process.env.ORACLE_HOST || "localhost",
    username: process.env.ORACLE_USER || "system",
    password: process.env.ORACLE_PASSWORD || "",
    database: process.env.ORACLE_NAME || "xe",
    port: parseInt(process.env.ORACLE_PORT || "1521"),
  },
};

const selectedEngine = process.env.DB_ENGINE || "mysql";
const selectedConfig = dbConfigurations[selectedEngine];

if (!selectedConfig) {
  throw new Error(`Unsupported database engine: ${selectedEngine}`);
}

export const sequelize = new Sequelize(
  selectedConfig.database,
  selectedConfig.username,
  selectedConfig.password,
  {
    host: selectedConfig.host,
    port: selectedConfig.port,
    dialect: selectedConfig.dialect,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Never expose the password: only connection metadata.
export const getDatabaseInfo = () => {
  const { dialect, host, port, database, username } = selectedConfig;
  return {
    engine: selectedEngine,
    connectionString: `${dialect}://${username}@${host}:${port}/${database}`,
  };
};

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Connected to ${selectedEngine.toUpperCase()}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Connection error on ${selectedEngine.toUpperCase()}: ${message}`);
    return false;
  }
};
