# MEMORY.md — Resumen ejecutivo CircularGuajira Backend

> Caché de contexto para cualquier IA/desarrollador. Máx. 50 líneas. Actualizar en cada cambio de código.
> Última actualización: 2026-10-03

## Estado actual
- Issues completadas: **ISS-00**, **ISS-01**, **ISS-02** y **ISS-03** (feature Recyclers). Siguiente: **ISS-04** (seeders con Faker).
- Progreso: 4 / 17 issues (ISS-00..ISS-16).

## Qué existe hoy
- `src/server.ts` → crea `App` y llama `listen()`.
- `src/config/index.ts` → clase `App`: settings (PORT del `.env`, hoy 3002; default 4000), middlewares, `GET /api/health`, rutas vía `Routes`, `dbConnection()` (conecta, `sync({ alter: true })`, `process.exit(1)` si falla).
- `src/database/db.ts` → exporta `sequelize` (instancia eager), `getDatabaseInfo()` y `testConnection()`. Valida de forma fail-fast `DB_DIALECT` y el bloque `DB_<MOTOR>_*` del motor activo.
- `src/shared/`: `errors/app-error.ts` (AppError, NotFoundError 404, ValidationError 400, ConflictError 409), `http/base-controller.ts` (`handle()`, `parseId()`), `database/with-transaction.ts`.
- `src/features/business/recyclers/`: model (`underscored`), `dto/`, repository, service (validación + unicidad de `documentNumber`), controller, routes `/api/recyclers` (+ `/:id`, `/:id/deactivate`), `http/` (7 `.http`). `src/routes/index.ts` agrega `RecyclersRoutes`.
- `.http` apuntan al puerto 3002.
- Dependencias: express 5, cors, dotenv, morgan, sequelize 6, mysql2, pg, pg-hstore, tedious, oracledb; dev: typescript, ts-node, nodemon, @types/*.
- Scripts: `dev`, `build`, `start`. Sin tests ni linter.

## Entorno
- Motores en Docker: MySQL 3306, Postgres 5433, MSSQL 1433, Oracle XE 1521. `.env` activo: `DB_DIALECT=mysql`.
- El `.env` del usuario tiene las credenciales correctas: se usa tal cual y no se modifica.
- Conexiones verificadas con MySQL y Postgres.

## Aún no existe
- `src/swagger/`, `src/database/seeders/`, Faker, features de negocio salvo recyclers.

## Decisiones y desviaciones respecto a los ISS
- `db.ts` lee `DB_DIALECT` + `DB_<MOTOR>_HOST/PORT/USERNAME/PASSWORD/NAME`, no los nombres `DB_ENGINE`/`MYSQL_HOST` del ISS-02.
- No se instaló `@types/sequelize` (Sequelize 6 trae tipos propios).
- `getDatabaseInfo()` no expone la contraseña.
- ISS-02 solo hace `authenticate()`; el `sync({ alter: true })` llega en ISS-03.
- `cors` se importa con `import`. Health check añadido en ISS-01.
- **Convenciones (2026-10-03, `docs/prompt.MD` §3.4)**: código en inglés y camelCase (BD snake_case con `underscored: true`); features por capas routes → controller → service → repository → model en `features/business/<plural>/`, con `src/shared/`. Mensajes de la API pueden ir en español. Mandan sobre el código de referencia de los ISS.
- Rutas en plural inglés (`/api/recyclers`), no `/api/recicladores` del ISS-03.

## Pendientes / problemas conocidos
- README desactualizado: menciona `tsx`, `npm run seed` y variables `DB_HOST`.
- `circularguajira_db` tiene tablas de un proyecto anterior (`sales`, `settlements` camelCase) y 4 recyclers viejos referenciados por ellas; `settlements` chocará con ISS-15. El `alter` de ISS-03 ya borró columnas viejas de `recyclers`.

## Flujo por issue (estándar)
- Skill `.claude/skills/issue-flow/`: Claude mueve el tablero (Project 9), verifica DoD, genera evidencias PNG, commitea `feat(iss-XX)` + push, registra el hash en la trazabilidad, commitea `docs(iss-XX)` + push y cierra el issue. Sin trailers ni leyendas de IA.
- Tablero: campos Status (Preparado/En curso/Verificacion/Hecho), Size y Prioridad (P0–P2); metadatos en `scripts/sync_issue.py`.

## Próximo paso
- ISS-04: `recyclers.seeder.ts` + `database/seeders/{index,counts}.ts` con Faker y script `npm run db:seed`. Antes, decidir qué hacer con las tablas viejas de la BD.
