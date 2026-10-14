# CircularGuajira API (Express + TypeScript + Sequelize)

Backend de la cadena de reciclaje de La Guajira: rutas de recolección → pesaje por material con tara → tarifa vigente → liquidación verificable, protegido con autenticación JWT y autorización RBAC por rol (`ADMIN`, `LOGISTICA`, `BASCULA`, `PLANTA`, `FINANZAS`).

El proceso de construcción, ISS por ISS, con criterios, evidencias y commits, está en [`docs/PROCESO.md`](docs/PROCESO.md).

## Requisitos

- Node.js 22 o superior (probado con 24) y npm.
- MySQL 8 con una base vacía y un usuario con permisos sobre ella (el código admite otros motores vía `DB_ENGINE`; el proyecto se prueba con MySQL).

## Configuración

```bash
npm install
cp .env.example .env   # completar credenciales de la base y JWT_SECRET
```

| Variable | Uso |
| :--- | :--- |
| `PORT` | Puerto HTTP (4000 por defecto) |
| `DB_ENGINE` | `mysql`, `postgres`, `mssql` u `oracle` |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_NAME`, `MYSQL_USER`, `MYSQL_PASSWORD` | Conexión a MySQL (análogas para los otros motores) |
| `JWT_SECRET` | Secreto HS256 del access token, mínimo 32 caracteres; sin él la API responde 500 en las rutas protegidas |
| `JWT_ACCESS_TTL` | Vida del access token en segundos (900) |
| `JWT_REFRESH_TTL_DAYS` | Vida del refresh token en días (7), renovada en cada rotación |

## Puesta en marcha

```bash
npm run db:migrate          # crea el esquema (migraciones versionadas con Umzug; nunca sync())
npm run db:seed             # roles, recursos, usuarios y matriz RBAC; después datos de negocio
npm run dev                 # http://localhost:4000  (GET /health, Swagger en /api/docs)
```

El servidor no arranca si hay migraciones pendientes. Otros comandos: `npm run db:migrate:status`, `npm run db:migrate:undo`, `npm run build` (compila a `dist/`) y `npx tsc --noEmit`.

Los seeders son idempotentes; las cantidades de negocio se ajustan por CLI o entorno (`npm run db:seed -- --recyclers=20`, `SEED_RECYCLERS=20`).

## Usuarios de laboratorio

Creados por `npm run db:seed`; contraseñas solo para desarrollo.

| Usuario | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | ---: |
| `admin` | `Admin2026!` | ADMIN: todo, incluida la administración de seguridad y los borrados físicos | 87 |
| `logistica` | `Logistica2026!` | LOGISTICA: recicladores, rutas, puntos y recolecciones | 30 |
| `bascula` | `Bascula2026!` | BASCULA: pesajes y recolecciones | 21 |
| `planta` | `Planta2026!` | PLANTA: catálogo de materiales; consulta recolecciones y pesajes | 13 |
| `finanzas` | `Finanzas2026!` | FINANZAS: tarifas y liquidaciones | 18 |

La matriz completa vive en `src/features/auth/resources/resource-catalog.ts` y se reconcilia en cada `db:seed`.

## Autenticación y modalidades de acceso

```bash
curl -s -X POST localhost:4000/api/session/login -H "Content-Type: application/json" \
  -d '{"identifier":"bascula","password":"Bascula2026!"}'
# -> { accessToken, tokenType, expiresIn, refreshToken, refreshExpiresIn }
curl -s -H "Authorization: Bearer <accessToken>" localhost:4000/api/weighings
```

| Modalidad | Middlewares | Rutas | Sin cumplir |
| :--- | :--- | :--- | :--- |
| OPEN | ninguno | `POST /api/session/login`, `/refresh`, `/logout`; `GET /health`, `/api/docs` | — |
| JWT | `authenticate` | `GET /api/session/profile`, `/api/session/permissions`; `/api/sessions/*` | 401 |
| JWT + RBAC | `authenticate`, `authorize` | negocio (`/api/recyclers`, `/api/materials`, `/api/routes`, `/api/collection-points`, `/api/collections`, `/api/weighings`, `/api/settlements`) y seguridad (`/api/users`, `/api/roles`, `/api/resources`, `/api/role-users`, `/api/resource-roles`) | 401 sin token, 403 sin concesión |

- Access token JWT HS256 de vida corta (algoritmo, `iss` y `aud` fijos; `sub`, `jti`); no lleva roles: la autorización se consulta en cada petición, así que retirar un permiso o desactivar un usuario tiene efecto inmediato.
- Refresh token opaco, guardado solo como SHA-256, de un solo uso: cada `refresh` lo rota y reutilizar uno consumido revoca toda la familia de la sesión.
- Deny by default: sin una concesión activa (`resource_roles`) del par (método, ruta) la respuesta es 403. Un permiso nuevo se da de alta con `POST /api/resources` y `POST /api/resource-roles`, sin desplegar código.

## Pruebas

Las pruebas usan la base configurada en `.env` (migrada y sembrada), levantan la App en un puerto libre y limpian sus datos `TEST-*`.

```bash
npm run test:all            # todas las suites en serie
npm run test:flow           # flujo de negocio por roles: recolección -> pesaje -> liquidación
npm run test:access         # 401/403 y la matriz de roles endpoint por endpoint
npm run test:session        # login, refresh, logout, perfil y las tres modalidades
```

También: `test:auth`, `test:users`, `test:rbac`, `test:permissions`, `test:sessions`.

## Estructura

```text
src/
├── config/index.ts            App: middlewares, rutas, Swagger y manejo de JSON malformado
├── database/                  conexión, migrator (Umzug), migraciones y SeedersRunner
├── features/
│   ├── business/              collectors, materials, routes, weighing, settlements
│   └── auth/                  access (authenticate, authorize), users, roles, resources,
│                              role-users, resource-roles, refresh-tokens, session
├── routes/index.ts            agregador de rutas
├── shared/                    auth (jwt, password, resource-match), errors, http, database
├── swagger/index.ts           registro OpenAPI (seguridad por operación desde el catálogo)
└── tests/                     suites node:test
```

Cada petición recorre `routes → controller → service → repository → model → Sequelize`; ninguna capa se salta.
