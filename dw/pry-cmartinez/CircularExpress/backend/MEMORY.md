# MEMORY.md — Resumen ejecutivo CircularGuajira Backend

> Caché de contexto para cualquier IA/desarrollador. Máx. 50 líneas. Actualizar en cada cambio de código.
> Última actualización: 2026-10-03

## Estado actual
- Issues completadas: **ISS-00** a **ISS-08** (feature Collections: jornadas). Siguiente: **ISS-09** (feature Materials: catálogo de materiales).
- Progreso: 9 / 17 issues (ISS-00..ISS-16).

## Qué existe hoy
- `src/server.ts` → `App` + `listen()`. `src/config/index.ts` → clase `App`: PORT del `.env` (3002), middlewares, `GET /api/health`, importa modelos y luego asociaciones, rutas vía `Routes`, `setupSwagger()`, `dbConnection()` (conecta, `syncDatabase()`, `process.exit(1)` si falla).
- `src/database/db.ts` → fija `process.env.TZ = "UTC"` (si no, oracledb/tedious corren las fechas DATEONLY un día en hosts UTC-5); exporta `sequelize`, `getDatabaseInfo()`, `testConnection()`, `syncDatabase()` (alter salvo en MSSQL: solo crea tablas faltantes). Fail-fast de `DB_DIALECT` y `DB_<MOTOR>_*`.
- `src/shared/`: `utils/dates.ts` (hoy en America/Bogota, validación y resta de fechas `YYYY-MM-DD`), `validation/query-filters.ts` (`parseIdFilter`), `errors/app-error.ts` (NotFound 404, Validation 400, Conflict 409), `http/base-controller.ts` (`handle()`, `parseId()`; mapea `ForeignKeyConstraintError`/`UniqueConstraintError` de la BD a 409), `database/with-transaction.ts`.
- Features en `src/features/business/<plural>/` (model, `dto/`, repository, service, controller, routes, seeder, swagger, `http/`):
  - `recyclers/` → `/api/recyclers` (unicidad `documentNumber`).
  - `routes/` → `/api/routes` (`municipality`, único `name+municipality`).
  - `collection-points/` → `/api/collection-points` (FK `routeId`, único `name+route_id`, `?routeId=`, respuesta incluye `route`; la ruta debe existir y estar activa). `collection-points.associations.ts`: belongsTo/hasMany, `onDelete: "NO ACTION"`.
  - `collections/` → `/api/collections` (FKs `recyclerId` y `routeId`, `collectionDate` DATEONLY no futura y por defecto hoy, único `recycler+route+date`, filtros `?recyclerId=&routeId=`, respuesta incluye `recycler` y `route`).
- `src/swagger/`: `swagger.types.ts`, `swagger.helpers.ts`, `index.ts` (registry, `/api/health`, `Error`, respuestas comunes) → `/api/docs` y `/api/docs.json`.
- `src/database/seeders/`: `counts.ts` (camelCase, CLI `--tabla=N`) e `index.ts` (`SeedersRunner`, orden de FK) → `npm run db:seed`; idempotente.
- Dependencias: express 5, cors, dotenv, morgan, swagger-ui-express 5, sequelize 6, mysql2, pg, pg-hstore, tedious, oracledb; dev: typescript, ts-node, nodemon, @faker-js/faker 10, @types/*.
- Scripts: `dev`, `build`, `start`, `db:seed`. Sin tests ni linter. `.http` en puerto 3002.

## Entorno
- Docker: MySQL 3306, Postgres 5433, MSSQL 1433, Oracle XE 1521. `.env` activo: `DB_DIALECT=mysql`; probar otro motor con `DB_DIALECT=<motor>`.
- BD propias: `circularexpress_db` (MySQL), `circularexpress_psql` (PG), `circularexpress_sqlserver` (MSSQL), usuario/esquema Oracle `circularexpress` (XE). Las viejas `circularguajira_*` no se tocan.
- Credenciales del `.env`: no cambiarlas sin pedido del usuario.

## Aún no existe
- Features ISS-09..ISS-15 (materials, material-rates, plants, material-lots, weighings, material-sales, settlements).

## Decisiones y desviaciones respecto a los ISS
- `db.ts` usa `DB_DIALECT` + `DB_<MOTOR>_*` (no `DB_ENGINE`/`MYSQL_HOST`); `getDatabaseInfo()` no expone la contraseña; sin `@types/sequelize`.
- **Convenciones (`docs/prompt.MD` §3.4)**: código en inglés y camelCase (BD snake_case con `underscored: true`); capas routes → controller → service → repository → model; mensajes de la API en español. Mandan sobre el código de referencia de los ISS. Rutas en plural inglés.
- Sync repetible en los 4 motores: unicidad con `indexes` nombrados (no `unique` en columna), estados `STRING` + `isIn` (no `ENUM`), FK con `onDelete: "NO ACTION"` (MSSQL/Oracle no aceptan `RESTRICT`; sin especificar, Sequelize pone `CASCADE`).
- Un service puede usar el repository de otro feature (p. ej. collection-points usa `RoutesRepository`), nunca su modelo.
- Cada feature nuevo se registra en `routes/index.ts`, `config/index.ts` (modelo + asociaciones), `swagger/index.ts` y `SeedersRunner`.

## Pendientes / problemas conocidos
- README desactualizado: menciona `tsx`, `npm run seed` y variables `DB_HOST`.

## Flujo por issue (estándar)
- Skill `.claude/skills/issue-flow/`: tablero Project 9, DoD, evidencias PNG, commits `feat(iss-XX)` y `docs(iss-XX)` con push, hash en la trazabilidad y cierre del issue. Sin trailers ni leyendas de IA.

## Próximo paso
- ISS-09: feature `materials` (catálogo base: PET, cartón, aluminio, cobre, vidrio...), sin FKs; luego ISS-10 `material-rates` con FK a materials.
