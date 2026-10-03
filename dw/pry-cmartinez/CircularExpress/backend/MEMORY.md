# MEMORY.md — Resumen ejecutivo CircularGuajira Backend

> Caché de contexto para cualquier IA/desarrollador. Máx. 50 líneas. Actualizar en cada cambio de código.
> Última actualización: 2026-10-03

## Estado actual
- Issues completadas: **ISS-00** a **ISS-05** (Swagger). Siguiente: **ISS-06** (feature Routes: rutas de recolección por municipio).
- Progreso: 6 / 17 issues (ISS-00..ISS-16).

## Qué existe hoy
- `src/server.ts` → crea `App` y llama `listen()`.
- `src/config/index.ts` → clase `App`: settings (PORT del `.env`, hoy 3002; default 4000), middlewares, `GET /api/health`, rutas vía `Routes`, `setupSwagger()`, `dbConnection()` (conecta, `syncDatabase()`, `process.exit(1)` si falla).
- `src/database/db.ts` → exporta `sequelize`, `getDatabaseInfo()`, `testConnection()` y `syncDatabase()` (alter salvo en MSSQL, donde solo crea tablas faltantes). Valida de forma fail-fast `DB_DIALECT` y el bloque `DB_<MOTOR>_*` del motor activo.
- `src/shared/`: `errors/app-error.ts` (AppError, NotFoundError 404, ValidationError 400, ConflictError 409), `http/base-controller.ts` (`handle()`, `parseId()`), `database/with-transaction.ts`.
- `src/features/business/recyclers/`: model (`underscored`), `dto/`, repository, service (validación + unicidad de `documentNumber`), controller, routes `/api/recyclers` (+ `/:id`, `/:id/deactivate`), `http/` (7 `.http`), `recyclers.seeder.ts`, `recyclers.swagger.ts`. `src/routes/index.ts` agrega `RecyclersRoutes`.
- `src/swagger/`: `swagger.types.ts` (`FeatureSwagger`) e `index.ts` (registry + `/api/health`, esquema `Error`, respuestas BadRequest/NotFound/Conflict) → UI `/api/docs`, JSON `/api/docs.json`.
- `src/database/seeders/`: `counts.ts` (conteos camelCase, CLI `--tabla=N`) e `index.ts` (`SeedersRunner`) → `npm run db:seed`; idempotente.
- `.http` apuntan al puerto 3002.
- Dependencias: express 5, cors, dotenv, morgan, swagger-ui-express 5, sequelize 6, mysql2, pg, pg-hstore, tedious, oracledb; dev: typescript, ts-node, nodemon, @faker-js/faker 10, @types/* (incl. swagger-ui-express).
- Scripts: `dev`, `build`, `start`, `db:seed`. Sin tests ni linter.

## Entorno
- Motores en Docker: MySQL 3306, Postgres 5433, MSSQL 1433, Oracle XE 1521. `.env` activo: `DB_DIALECT=mysql`.
- BD propias de CircularExpress (2026-10-03): `circularexpress_db` (MySQL), `circularexpress_psql` (PG), `circularexpress_sqlserver` (MSSQL) y usuario/esquema Oracle `circularexpress` en XE. Las viejas `circularguajira_*` no se tocaron.
- CRUD de recyclers verificado en los 4 motores. Credenciales del `.env`: no cambiarlas sin pedido del usuario.

## Aún no existe
- Features de negocio salvo recyclers.

## Decisiones y desviaciones respecto a los ISS
- `db.ts` lee `DB_DIALECT` + `DB_<MOTOR>_HOST/PORT/USERNAME/PASSWORD/NAME`, no los nombres `DB_ENGINE`/`MYSQL_HOST` del ISS-02.
- No se instaló `@types/sequelize` (Sequelize 6 trae tipos propios).
- `getDatabaseInfo()` no expone la contraseña.
- ISS-02 solo hace `authenticate()`; el `sync({ alter: true })` llega en ISS-03.
- `cors` se importa con `import`. Health check añadido en ISS-01.
- **Convenciones (2026-10-03, `docs/prompt.MD` §3.4)**: código en inglés y camelCase (BD snake_case con `underscored: true`); features por capas routes → controller → service → repository → model en `features/business/<plural>/`, con `src/shared/`. Mensajes de la API pueden ir en español. Mandan sobre el código de referencia de los ISS.
- Rutas en plural inglés (`/api/recyclers`), no `/api/recicladores` del ISS-03.
- Modelos: unicidad con `indexes` nombrados (no `unique: true` en columna) y estados como `STRING` + `isIn` (no `ENUM`), para que el sync sea repetible en los 4 motores.

## Pendientes / problemas conocidos
- README desactualizado: menciona `tsx`, `npm run seed` y variables `DB_HOST`.

## Flujo por issue (estándar)
- Skill `.claude/skills/issue-flow/`: Claude mueve el tablero (Project 9), verifica DoD, genera evidencias PNG, commitea `feat(iss-XX)` + push, registra el hash en la trazabilidad, commitea `docs(iss-XX)` + push y cierra el issue. Sin trailers ni leyendas de IA.
- Tablero: campos Status (Preparado/En curso/Verificacion/Hecho), Size y Prioridad (P0–P2); metadatos en `scripts/sync_issue.py`.

## Próximo paso
- ISS-06: feature `routes` (`route.model.ts`, dto, repository, service, controller, routes, seeder, swagger) cableado en los 4 agregadores. Cada feature nuevo debe registrar su `.swagger.ts` en `src/swagger/index.ts` y su seeder en `SeedersRunner`.
