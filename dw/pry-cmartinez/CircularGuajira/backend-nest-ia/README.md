# CircularGuajira — Backend de Negocio

Backend de negocio del proyecto **CircularGuajira**, un sistema de trazabilidad para asociaciones y cooperativas de reciclaje: registra recicladores, materiales, tarifas por kilogramo y liquidaciones de pesaje (peso bruto, tara, peso neto y pago), actualizando el stock acumulado por material en cada liquidación.

Construido con [NestJS](https://nestjs.com/) + [Sequelize](https://sequelize.org/) siguiendo **Clean Architecture** (4 capas por feature: `domain` → `application` → `infrastructure` → `presentation`). Ver el contrato de arquitectura completo en [`docs/Prompt.md`](docs/Prompt.md) y la trazabilidad de issues en [`trazabilidad/`](trazabilidad/).

> Esta entrega (**ISS-07**) integra las 4 features de negocio (`recyclers`, `materials`, `material-rates`, `settlements`), el orquestador de seeders, Swagger y esta guía de demo. No incluye autenticación, usuarios ni JWT (fuera de alcance de la Semana 4, ver [Prohibiciones](#prohibiciones-de-alcance)).

## Requisitos previos

- **Node.js v20+**
- **npm v10+**
- Un motor de base de datos SQL dockerizado y accesible (por defecto **MySQL** en el puerto `3306`; también soporta PostgreSQL, SQL Server y Oracle XE — ver [`docs/Prompt.md`](docs/Prompt.md) sección 6).

## 1. Crear la base de datos

El backend **no** crea ni altera el esquema automáticamente (`sync({ alter: false })`), así que la base de datos debe existir de antemano. Con el motor MySQL levantado, crea la base de datos vacía:

```sql
CREATE DATABASE circularguajira_db;
```

(Ajusta el nombre si usas otro motor u otro valor en `.env`; ver `docs/Instalacion Motores.md` si necesitas levantar el contenedor del motor.)

## 2. Configurar el entorno

Copia `.env.example` a `.env` y completa los valores según tu motor:

```bash
cp .env.example .env
```

Variables clave (validación **Fail-Fast** al arrancar: la app no inicia si faltan o son inválidas):

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP del backend (por defecto `3002`) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `DB_DIALECT` | Motor activo: `mysql` \| `postgres` \| `mssql` \| `oracle` |
| `DB_<DIALECT>_HOST/PORT/USERNAME/PASSWORD/NAME` | Credenciales del bloque correspondiente al motor activo (solo ese bloque es obligatorio) |

El archivo `.env` **nunca** se versiona (está en `.gitignore`); `.env.example` sí se versiona como plantilla.

## 3. Instalación, compilación y arranque

```bash
npm install

# Desarrollo (libera el puerto y arranca en modo watch)
npm run start:dev

# Alternativa: compilar y ejecutar el build
npm run build
npm run start:prod
```

El servidor queda disponible en `http://localhost:3002` (o el valor de `PORT`), con prefijo global `/api`.

### Sembrar datos base

```bash
npm run seed
```

Ejecuta, en orden estricto de dependencias, `Recyclers → Materials → MaterialRates`. Cada seeder es idempotente (verifica existencia antes de insertar), por lo que correr `npm run seed` varias veces deja exactamente los mismos registros sin duplicar nada. `settlements` **no** se siembra: se genera dinámicamente al registrar un pesaje (ver la demo abajo).

## 4. Endpoints disponibles

| Recurso | Método y ruta | Descripción |
|---|---|---|
| Salud | `GET /api/health` | Verifica que el servicio está vivo |
| Recyclers | `POST /api/recyclers` | Registrar un reciclador |
| Recyclers | `GET /api/recyclers` | Listar recicladores (paginado) |
| Recyclers | `GET /api/recyclers/:id` | Obtener un reciclador |
| Recyclers | `PATCH /api/recyclers/:id` | Actualizar un reciclador |
| Materials | `POST /api/materials` | Registrar un material |
| Materials | `GET /api/materials` | Listar materiales (paginado) |
| Materials | `GET /api/materials/:id` | Obtener un material |
| Materials | `PATCH /api/materials/:id` | Actualizar un material |
| MaterialRates | `POST /api/material-rates` | Registrar una tarifa |
| MaterialRates | `GET /api/material-rates` | Listar tarifas (paginado) |
| MaterialRates | `GET /api/material-rates/vigente/:materialId` | Tarifa vigente de un material |
| MaterialRates | `GET /api/material-rates/:id` | Obtener una tarifa por id |
| Settlements | `POST /api/settlements` | Registrar una liquidación (transacción atómica) |
| Settlements | `GET /api/settlements/:id` | Obtener el detalle de una liquidación |

**Documentación interactiva (Swagger/OpenAPI):** [`http://localhost:3002/api/docs`](http://localhost:3002/api/docs) — documenta los 4 recursos de negocio (`recyclers`, `materials`, `material-rates`, `settlements`) con schemas, ejemplos y códigos de respuesta.

## 5. Libreto de la demo (reproducible con cURL)

Con la base de datos vacía y el servidor arrancado (`npm run start:dev`), en otra terminal:

### 5.1 Verificación de salud

```bash
curl http://localhost:3002/api/health
```

```json
{ "status": "ok" }
```

### 5.2 Sembrar datos base

```bash
npm run seed
```

Carga `Recyclers`, `Materials` y `MaterialRates` (con `stockKg` inicial en `0`).

### 5.3 Crear un reciclador

```bash
curl -X POST http://localhost:3002/api/recyclers \
  -H "Content-Type: application/json" \
  -d '{
    "documentNumber": "900999888",
    "name": "Asociación Uribia",
    "phone": "3009998887",
    "email": "contacto@asociacionuribia.co",
    "address": "Uribia, La Guajira"
  }'
```

La respuesta trae el `id` del reciclador recién creado (usarlo en el paso 5.6).

### 5.4 Consultar los materiales sembrados

```bash
curl http://localhost:3002/api/materials
```

Anota el `id` de un material (por ejemplo, `PET`) para el siguiente paso.

### 5.5 Consultar la tarifa vigente de ese material

```bash
curl http://localhost:3002/api/material-rates/vigente/1
```

Devuelve la tarifa activa sembrada (`pricePerKg`, `stockKg` actual, etc.) para el `materialId` indicado.

### 5.6 Registrar un pesaje y liquidar transaccionalmente

```bash
curl -X POST http://localhost:3002/api/settlements \
  -H "Content-Type: application/json" \
  -d '{
    "recyclerId": 1,
    "items": [
      { "materialId": 1, "grossWeight": 250, "tareWeight": 15 }
    ]
  }'
```

Peso bruto `250kg` − tara `15kg` → peso neto `235kg` × tarifa vigente → liquidación generada con `subtotal`/`total` calculados. La operación es una **transacción atómica**: bloquea la tarifa, calcula el pesaje, **incrementa `stockKg`** de la tarifa y solo si todo es válido inserta la liquidación y su detalle.

**Verificar que `stockKg` se actualizó:**

```bash
curl http://localhost:3002/api/material-rates/vigente/1
```

El `stockKg` debe reflejar el incremento de `235` respecto al valor consultado en el paso 5.5.

### 5.7 Prueba de invariante de error (400 Bad Request)

```bash
curl -i -X POST http://localhost:3002/api/settlements \
  -H "Content-Type: application/json" \
  -d '{
    "recyclerId": 1,
    "items": [
      { "materialId": 1, "grossWeight": 10, "tareWeight": 50 }
    ]
  }'
```

Tara (`50kg`) mayor al peso bruto (`10kg`) viola el invariante de dominio (peso neto debe ser > 0): la API responde `400 Bad Request` y la transacción hace **rollback total** — ni la liquidación ni el `stockKg` de la tarifa quedan alterados. Repetir el paso 5.6 confirma que el `stockKg` no cambió por este intento fallido.

### 5.8 Consultar el detalle de la liquidación emitida

```bash
curl http://localhost:3002/api/settlements/1
```

Devuelve la liquidación con su cabecera (`subtotal`, `tax`, `discounts`, `total`, `status`) y el detalle de pesajes (`grossWeight`, `tareWeight`, `netWeight`, `pricePerKg`, `total` por ítem).

## 6. Otros scripts

| Script | Descripción |
|---|---|
| `npm run start` | Arranca Nest sin watch mode |
| `npm run start:dev` | Libera el puerto y arranca en modo watch |
| `npm run build` | Compila el proyecto a `dist/` |
| `npm run start:prod` | Ejecuta el build compilado |
| `npm run seed` | Orquestador global de seeders: `Recyclers → Materials → MaterialRates` |
| `npm run seed:recyclers` / `seed:materials` / `seed:material-rates` | Seeders individuales (evidencia manual por feature) |
| `npm run test` | Ejecuta las pruebas unitarias |
| `npm run test:e2e` | Ejecuta las pruebas end-to-end |
| `npm run lint` | Corre el linter |

## 7. Estructura de carpetas (Clean Architecture)

```
src/
├── main.ts                            # Bootstrap: prefijo /api, CORS, ValidationPipe, Swagger (/api/docs)
├── app.module.ts                      # Módulo raíz
├── app.controller.ts                  # Endpoint GET /api/health
├── config/                            # Configuración y validación Fail-Fast de variables de entorno
├── common/                            # Excepciones, filtros e interceptores transversales
├── infrastructure/
│   └── database/
│       ├── sequelize/                 # Factory multi-motor y módulo de conexión
│       └── seeders/                   # Orquestador global (seeders.runner.ts)
└── features/
    └── business/                      # Módulos de negocio (Clean Architecture por feature)
        ├── recyclers/
        ├── materials/
        ├── material-rates/
        └── settlements/
```

Cada feature respeta 4 capas físicas con regla de dependencia estricta hacia adentro: `presentation` → `application` → `domain` ← `infrastructure`.

## Prohibiciones de alcance

Esta entrega **no** incluye módulos de autenticación ni seguridad de usuarios:

- No existe `src/features/auth/` ni `src/config/jwt/`.
- `package.json` no depende de `@nestjs/jwt`, `passport`, `passport-jwt` ni `bcrypt`.
- No hay `login`, `guards`, `RBAC` ni gestión de usuarios en `src/`.

Ver el detalle de cada issue en [`trazabilidad/`](trazabilidad/) (`ISS-01` a `ISS-07`).
