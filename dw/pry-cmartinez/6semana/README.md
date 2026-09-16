# Backend con Express.js, TypeScript y Sequelize

Notas  de clase y consideraciones previas para la creación de un proyecto backend con Node.js, Express, TypeScript, Clean Architecture y Sequelize.

---

## 1. Consideraciones y Configuración Previa al Proyecto

### 1.1 Preparación del Entorno

Antes de iniciar el proyecto, se crea y configura la carpeta de trabajo en la terminal:

```bash
mkdir sitealmacen
sudo chmod -R 777 sitealmacen/
cd sitealmacen
code .
```

#### Qué hace cada comando:
* **`mkdir sitealmacen`**: Crea el directorio raíz donde residirá todo el código del proyecto.
* **`sudo chmod -R 777 sitealmacen/`**: Ajusta los permisos de acceso a la carpeta del proyecto para garantizar que Node.js, npm y las herramientas de desarrollo puedan escribir, instalar paquetes e inicializar archivos sin bloqueos de permisos a nivel del sistema operativo.
* **`cd sitealmacen`**: Ingresa al directorio recién creado.
* **`code .`**: Abre la carpeta directamente en Visual Studio Code. Dentro de VS Code, abrimos una nueva terminal (`Menú > Terminal > Nueva Terminal`) para trabajar los siguientes pasos de forma cómoda.

---

### 1.2 Paso 0: Inicialización del Proyecto Node.js y TypeScript

1. **Inicializar `package.json`**:
   ```bash
   npm init -y
   ```
   *  Genera el archivo manifiesto por defecto (`package.json`) que registrará el nombre del proyecto, versión, scripts y dependencias.

2. **Instalar Dependencias de Desarrollo**:
   ```bash
   npm install -D typescript @types/node nodemon ts-node
   npm install -D @types/express @types/morgan @types/cors
   ```

   #### Qué hace cada cosa:
   * **`typescript`**: Es como usar “JavaScript con superpoderes”. Te ayuda a detectar errores de sintaxis y tipos antes de ejecutar el código y te da autocompletado inteligente en el editor.
   * **`ts-node` y `nodemon`**: `ts-node` permite ejecutar directamente archivos `.ts` en Node.js sin necesidad de transpolar manualmente a JavaScript primero. `nodemon` monitorea los cambios en los archivos fuente y reinicia el servidor automáticamente. Al combinarse (`nodemon --exec ts-node`), hacen que tu flujo de trabajo sea rápido y cómodo, con recarga automática (*hot-reload*).
   * **`@types/`**: Son “diccionarios” de definiciones de tipos que le explican a TypeScript cómo funcionan librerías escritas originalmente en JavaScript puro (como Node, Express, Morgan o Cors). Así tu editor entiende tu código y te da sugerencias útiles.

3. **Generar Archivo de Configuración de TypeScript**:
   ```bash
   npx tsc --init
   ```
   * Crea el archivo `tsconfig.json` con todas las opciones compilador de TypeScript inicializadas.

4. **Configurar `tsconfig.json`**:
   ```json
   {
     "compilerOptions": {
       "target": "es2016",
       "module": "commonjs",
       "rootDir": "./src",
       "outDir": "./dist",
       "esModuleInterop": true,
       "forceConsistentCasingInFileNames": true,
       "strict": true,
       "verbatimModuleSyntax": false,
       "skipLibCheck": true
     }
   }
   ```

   #### Qué hace cada opción de la configuración:
   * **`rootDir: "./src"` y `outDir: "./dist"`**: Separa estrictamente el código fuente escrito en TypeScript (`src/`) del código ejecutable transpilado para producción (`dist/`).
   * **`target: "es2016"` y `module: "commonjs"`**: Garantiza la compatibilidad completa del código JavaScript resultante con el motor de ejecución de Node.js.
   * **`strict: true`**: Activa la verificación estricta de tipos para prevenir valores nulos o indefinidos inesperados y detectar errores en tiempo de compilación.
   * **`esModuleInterop: true`**: Permite la importación limpia de módulos CommonJS utilizando la sintaxis estándar moderna de ES Modules (`import express from 'express'`).

5. **Configurar `package.json` (Scripts y Tipo)**:
   ```json
   {
     "type": "commonjs",
     "scripts": {
       "build": "tsc",
       "dev": "nodemon src/server.ts --exec ts-node"
     }
   }
   ```

   #### Qué hace cada script configurado:
   * **`"build": "tsc"`**: Compila todo el código TypeScript ubicado en `src/` a JavaScript estándar en la carpeta `dist/` para su posterior despliegue en producción.
   * **`"dev": "nodemon src/server.ts --exec ts-node"`**: Arranca el servidor de desarrollo utilizando `nodemon` para escuchar cambios en tiempo real y `ts-node` para ejecutar los archivos `.ts` al instante.

---

### 1.3 Paso 1 y 2: Instalación de Dependencias Core y Estructura de Directorios

1. **Instalar Dependencias Principales (Core)**:
   ```bash
   npm install express cors morgan dotenv
   ```

   #### Qué hace cada dependencia instalada:
   * **`express`**: Framework web minimalista para Node.js encargada de gestionar el enrutamiento HTTP, la recepción de peticiones (GET, POST, PUT, DELETE) y el envío de respuestas JSON.
   * **`cors`**: Middleware que habilita CORS (Cross-Origin Resource Sharing), permitiendo que aplicaciones cliente (React, Angular, apps móviles) consuman nuestra API desde otros puertos o dominios.
   * **`morgan`**: Logger de peticiones HTTP que muestra en consola los detalles de cada solicitud entrante (método, ruta, código de estado y tiempo de respuesta), facilitando el monitoreo durante el desarrollo.
   * **`dotenv`**: Carga las variables de entorno definidas en un archivo `.env` en el objeto global `process.env`, evitando exponer contraseñas, claves secretas o puertos en el código fuente.
### 1.4 Paso 3: Configuración del Servidor (`server.ts` y `config/index.ts`)

1. **Crear el archivo `src/server.ts`**:
   ```typescript
   import { App } from './config/index';

   async function main() {
       const app = new App();
       await app.listen();
   }

   main();
   ```
   * **Por qué se hace así**: Mantiene el punto de entrada de la aplicación extremadamente limpio y desacoplado, limitándose únicamente a instanciar la clase `App` y ejecutar el método `listen()`.

2. **Crear el archivo `src/config/index.ts`**:
   ```typescript
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
           // Las rutas se configurarán más adelante
       }

       private async dbConnection(): Promise<void> {
           // Conexión, configuración y sincronización de Base de Datos
       }

       async listen() {
           await this.app.listen(this.app.get('port'));
           console.log(`Servidor ejecutándose en puerto ${this.app.get('port')}`);
       }
   }
   ```

   #### Qué hace cada método dentro de la clase `App`:
   * **`constructor()`**: Ejecuta la secuencia ordenada de inicialización al instanciar la aplicación.
   * **`settings()`**: Configura el puerto del servidor, tomando la variable de entorno `PORT` si existe o usando `4000` por defecto.
   * **`middlewares()`**: Registra los procesadores centrales: `morgan('dev')` para logs en consola, `cors()` para acceso entre dominios, `express.json()` para procesar cuerpos JSON en peticiones POST/PUT y `express.urlencoded()` para formularios.
   * **`routes()`**: Espacio reservado para registrar los enrutadores por módulo.
   * **`dbConnection()`**: Método asíncrono que inicializa y sincroniza la conexión con el ORM.
   * **`listen()`**: Activa la escucha HTTP en el puerto indicado y confirma la ejecución en consola.

3. **Verificación Inicial**:
   Ejecutar en terminal:
   ```bash
   npm run dev
   ```
   Dirigirse en el navegador o cliente HTTP a `http://localhost:4000` para comprobar el arranque del servidor.

---

## 2. Arquitectura de Aplicación (Express + MVC + Clean Architecture)

### 2.1 Principios de Clean Architecture y Separación por Capas
Express es un framework minimalista para Node: no trae una estructura por defecto, así que la organizamos nosotros en capas claramente delimitadas:

* **Routes**: Definen los endpoints de la API y especifican qué controlador procesa cada solicitud.
* **Controllers**: Reciben los objetos `req` y `res`, realizan validaciones iniciales de la petición y delegan la persistencia en los modelos.
* **Models**: Representan las tablas de la base de datos y la lógica de acceso/manipulación de datos vía ORM.
* **Config / Database**: Encargados del arranque de la app y la conexión a la base de datos, totalmente separados de la lógica de negocio.

#### Cómo funciona Clean Architecture:
Las capas superiores dependen de las inferiores y nunca al revés (un controlador conoce su modelo, pero el modelo no conoce detalles de Express). De este modo, cada pieza se puede probar o reemplazar de manera aislada sin romper el resto del sistema.

### 2.2 Organización por Dominios de Negocio
En proyectos escalables, los archivos se organizan por dominio de negocio dentro de `src/`:

```text
src/
├── server.ts              # Arranque de la app
├── config/                 # Configuración general
├── database/                # Conexión Sequelize
├── models/<dominio>/        # Entidades Sequelize (Model.init)
├── controllers/<dominio>/   # Lógica de cada endpoint
├── routes/<dominio>/        # Router de Express por recurso
├── middleware/               # Middlewares propios (auth, validaciones)
└── http/                     # Archivos .http de prueba
```

**Ejemplo práctico**:
El dominio `Client` agrupa `models/business/Client.ts`, `controllers/business/ClientController.ts` y `routes/business/ClientRoutes.ts`, montándose en la aplicación bajo el prefijo `/api/clients`.

### Entidades de negocio implementadas
Siguiendo el mismo esquema (model + controller + routes), a partir de la guía de dominio (`docs/guia-entreganexo.md`) se implementaron:

| Entidad | Endpoint | Notas |
| :--- | :--- | :--- |
| **Client** | `/api/clients` | Cliente del marketplace |
| **Comercio** | `/api/comercios` | Tienda/aliado que publica productos |
| **Repartidor** | `/api/repartidores` | Aliado logístico para entregas |
| **Producto** | `/api/productos` | Pertenece a un `Comercio` (`comercio_id`), `sku` único |

Todas exponen el mismo CRUD (`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`) y usan `is_active` como borrado lógico (soft delete) en lugar de eliminar el registro.

---

## 3. ORM: Sequelize con 4 Motores Intercambiables

Usamos **Sequelize** como ORM porque permite escribir los modelos una sola vez y apuntar a distintos motores de base de datos solo cambiando la configuración en variables de entorno, sin alterar el código fuente.

### Motores Disponibles (`src/database/index.ts`)

| Motor | Driver npm | Puerto por defecto |
| :--- | :--- | :--- |
| **MySQL** | `mysql2` | `3306` |
| **PostgreSQL** | `pg` / `pg-hstore` | `5433` |
| **SQL Server** | `tedious` | `1433` |
| **Oracle** | `oracledb` | `1521` |

### Selección Dinámica vía `.env`
El motor activo se elige con la variable `DB_DIALECT` en el archivo `.env` (`mysql` | `postgres` | `mssql` | `oracle`). Solo requiere completar el bloque de credenciales (`DB_<MOTOR>_*`) correspondiente; la conexión se valida automáticamente al arrancar (*fail-fast*).

---

## 4. Comandos Útiles del Proyecto

```bash
npm install       # Instala todas las dependencias declaradas en package.json
npm run dev        # Levanta el servidor con nodemon + ts-node (hot reload en desarrollo)
npm run build       # Compila todo el código TypeScript a JavaScript de producción (tsc)
npm run seed        # Alimenta la base de datos con datos falsos (faker)
npm run clean        # Vacía por completo las tablas de negocio (TRUNCATE)
```

## 5. Seed y Limpieza de la Base de Datos (`src/faker/`)

Dos scripts en JS plano (no TypeScript), pensados como pareja: uno llena, el otro deja todo en cero. Ambos usan `require("ts-node/register")` para importar directamente los modelos `.ts` (`getSequelize`, `Client`, `Comercio`, `Repartidor`, `Producto`) sin compilar antes, y toman el motor activo desde `.env` igual que el resto de la app.

### `seed.js`
* Llama a `sequelize.sync()` para crear las tablas si no existen.
* Inserta `Producto` enlazando cada registro a un `Comercio` ya creado (`comercio_id`).
* Cantidad de registros por entidad configurable con `SEED_TOTAL` (por defecto `10`):
  ```bash
  SEED_TOTAL=25 npm run seed
  ```

### `clean.js`
* Hace `TRUNCATE` de las 4 tablas (`productos` primero, por ser la que referencia a `comercios`) y reinicia los autoincrementales, dejando la base como recién creada.
* Útil antes de una demo o para repetir el `seed` desde IDs limpios (`1, 2, 3...`):
  ```bash
  npm run clean && npm run seed
  ```

### Auditoría contra los 4 motores
Ambos scripts se probaron con datos reales (`seed` → verificar filas → `clean` → verificar 0 filas) en MySQL, PostgreSQL, SQL Server y Oracle, cambiando solo `DB_DIALECT`. Dos hallazgos:

* **Bug real (corregido):** `faker.commerce.price()` devuelve un `string`. MySQL/Postgres/MSSQL lo castean solos al insertar en la columna `DECIMAL`, pero el driver de Oracle (`node-oracledb`) es estricto y rechazaba el bind con `NJS-011: bind value and type mismatch`. Se corrigió envolviendo el valor en `Number(...)` en `seed.js`.
* **Limitación documentada (no corregida):** en Oracle, `TRUNCATE TABLE` sí vacía la tabla pero **no reinicia la secuencia IDENTITY** (a diferencia de MySQL/MSSQL, que la resetean siempre, y Postgres, donde se pide explícitamente con `RESTART IDENTITY`). El dialecto Oracle de Sequelize no expone una cláusula equivalente. Efecto práctico: tras un `clean` + `seed` en Oracle, los IDs siguen la numeración anterior en vez de volver a `1`; los datos sí quedan en cero filas.
