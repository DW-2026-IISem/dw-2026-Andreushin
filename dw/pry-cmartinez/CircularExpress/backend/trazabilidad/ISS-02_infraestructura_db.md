# ISS-02 — Infraestructura de Base de Datos Multi-Motor con Sequelize

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-02` |
| **Módulo / Feature** | `src/features/business/core` |
| **Prerrequisitos (DoR)** | ISS-01 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-01**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 3. ISS-02 — Infraestructura de Base de Datos

### Detalle de Implementación
**Objetivo:** Instalar Sequelize y drivers multi-motor, configurar `.env` y el módulo de conexión `database/db.ts`.
**Bloqueado por:** ISS-01.

##### Criterios de aceptación
* [ ] Sequelize y drivers instalados (`mysql2`, `pg`, `pg-hstore`, `tedious`, `oracledb`).
* [ ] Archivo `.env` configurado con soporte para varios motores de BD.
* [ ] Archivo `src/database/db.ts` exportando `sequelize`, `getDatabaseInfo`, `testConnection`.

#### 3.1 Drivers y `.env`
```bash
npm install sequelize@^6.37.8 mysql2@^3.24.4 pg@^8.23.0 pg-hstore@^2.3.4   tedious@^20.0.0 oracledb@^7.0.1
npm install -D @types/sequelize@^6.12.0
```

```bash
: > .env
cat >> .env << 'EOF'
PORT=4000

# Seleccionar motor de base de datos (mysql | postgres | mssql | oracle)
DB_ENGINE=mysql

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=admin
MYSQL_PASSWORD=password123
MYSQL_NAME=circular_guajira_db
MYSQL_PORT=3306

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123
POSTGRES_NAME=circular_guajira_db
POSTGRES_PORT=5432
EOF
```

#### 3.2 Configuración Sequelize (`src/database/db.ts`)
```bash
: > src/database/db.ts
cat >> src/database/db.ts << 'EOF'
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

interface DatabaseConfig {
  dialect: string;
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
    database: process.env.MYSQL_NAME || "circular_guajira_db",
    port: parseInt(process.env.MYSQL_PORT || "3306")
  },
  postgres: {
    dialect: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "",
    database: process.env.POSTGRES_NAME || "circular_guajira_db",
    port: parseInt(process.env.POSTGRES_PORT || "5432")
  }
};

const selectedEngine = process.env.DB_ENGINE || "mysql";
const selectedConfig = dbConfigurations[selectedEngine];

if (!selectedConfig) {
  throw new Error(`Motor de base de datos no soportado: ${selectedEngine}`);
}

console.log(`🔌 Conectando a base de datos CircularGuajira: ${selectedEngine.toUpperCase()}`);

export const sequelize = new Sequelize(
  selectedConfig.database,
  selectedConfig.username,
  selectedConfig.password,
  {
    host: selectedConfig.host,
    port: selectedConfig.port,
    dialect: selectedConfig.dialect as any,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const getDatabaseInfo = () => {
  return {
    engine: selectedEngine,
    config: selectedConfig,
    connectionString: `${selectedConfig.dialect}://${selectedConfig.username}@${selectedConfig.host}:${selectedConfig.port}/${selectedConfig.database}`
  };
};

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${selectedEngine.toUpperCase()}`);
    return true;
  } catch (error) {
    console.error(`❌ Error de conexión a ${selectedEngine.toUpperCase()}:`, error);
    return false;
  }
};
EOF
```

##### Verificación ISS-02
```bash
npx tsc --noEmit
```

---

---

## 3. Definición de Done (DoD) y Verificación
Para marcar esta Issue como **Completada**, debes validar:
1. Compilación de TypeScript exitosa (`npm run build` o `npx tsc --noEmit`).
2. Arranque del servidor sin errores de sintaxis o de conexión a BD (`npm run dev`).
3. Ejecución y respuesta HTTP esperada en los endpoints del módulo (`.http` / REST Client).
4. Verificación de persistencia en la base de datos o interfaz Swagger `/api/docs`.
