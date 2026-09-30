# ISS-01 — Esqueleto del Proyecto Express 5 + TypeScript

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-01` |
| **Módulo / Feature** | `src/features/business/core` |
| **Prerrequisitos (DoR)** | ISS-00 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-00**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 2. ISS-01 — Esqueleto del proyecto

### Detalle de Implementación
**Objetivo:** Crear proyecto npm + TypeScript + Express con estructura por `features/` y servidor HTTP base.
**Bloqueado por:** ISS-00.

##### Criterios de aceptación
* [ ] **2.1** Existe `package.json` con `"type": "commonjs"` y scripts `build` / `dev`.
* [ ] **2.2** Árbol `src/` con `config`, `database/seeders`, `routes`, `features/business/recycler`.
* [ ] **2.3** Dependencias Express/TS instaladas.
* [ ] **2.4** Existe `tsconfig.json` (`rootDir: ./src`, `outDir: ./dist`, `strict: true`).
* [ ] **2.5** Existen `src/server.ts` y `src/config/index.ts`.
* [ ] `npx tsc --noEmit` sin errores al cerrar el ISS.

#### 2.1 Inicializar npm y scripts
```bash
mkdir app-circularguajira-express
cd app-circularguajira-express
npm init -y
mkdir -p docs
```

**PARCHE** — `package.json` (modificar dentro de `scripts` y añadir `type`):
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "nodemon --watch src --ext ts --exec ts-node -- src/server.ts"
  },
  "type": "commonjs"
}
```

#### 2.2 Estructura de carpetas
```bash
mkdir -p   src/config   src/database/seeders   src/routes   src/features/business/recycler
```

#### 2.3 Dependencias base
```bash
npm install express@^5.2.1 cors@^2.8.6 dotenv@^17.4.2 morgan@^1.12.1

npm install -D typescript@~5.9.2 ts-node@^10.9.2 nodemon@^3.1.14   @types/node@^22.20.3 @types/express@^5.0.6   @types/cors@^2.8.19 @types/morgan@^1.9.10
```

#### 2.4 TypeScript (`tsconfig.json`)
```bash
: > tsconfig.json
cat >> tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "types": ["node"],
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

#### 2.5 Servidor y App (`src/server.ts` y `src/config/index.ts`)
```bash
: > src/server.ts
cat >> src/server.ts << 'EOF'
import { App } from './config/index';

async function main() {
    const app = new App();
    await app.listen();
}

main();
EOF
```

```bash
: > src/config/index.ts
cat >> src/config/index.ts << 'EOF'
import dotenv from "dotenv";
import express, { Application } from "express";
import morgan from "morgan";
var cors = require("cors");

dotenv.config();

export class App {
  public app: Application;

  constructor(private port?: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
    this.dbConnection();
  }

  private settings(): void {
    this.app.set('port', this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan('dev'));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    // ISS-03 §4.3
  }

  private async dbConnection(): Promise<void> {
    // ISS-02 / ISS-03
  }

  async listen() {
    await this.app.listen(this.app.get('port'));
    console.log(`🚀 Servidor CircularGuajira ejecutándose en puerto ${this.app.get('port')}`);
  }
}
EOF
```

##### Verificación ISS-01
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
