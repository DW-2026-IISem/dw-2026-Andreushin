# MEMORY.md — Resumen ejecutivo CircularGuajira Backend

> Caché de contexto para cualquier IA/desarrollador. Máx. 50 líneas. Actualizar en cada cambio de código.
> Última actualización: 2026-10-03

## Estado actual
- Issues completadas: **ISS-01** (esqueleto) y **ISS-02** (infraestructura DB). Siguiente: **ISS-03** (feature Recycler).
- Progreso: 2 / 16 issues (ISS-00 entorno se asume verificado).

## Qué existe hoy
- `src/server.ts` → crea `App` y llama `listen()`.
- `src/config/index.ts` → clase `App`: settings (PORT del `.env`, hoy 3002; default 4000), middlewares (morgan, cors, json, urlencoded), `GET /api/health`, `dbConnection()` que prueba la conexión y hace `process.exit(1)` si falla.
- `src/database/db.ts` → exporta `sequelize` (instancia eager), `getDatabaseInfo()` y `testConnection()`. Valida de forma fail-fast `DB_DIALECT` y el bloque `DB_<MOTOR>_*` del motor activo.
- `routes()` sigue siendo un stub (`// ISS-03 §4.3`); en `dbConnection()` hay un marcador `// ISS-03` para modelos + `sync()`.
- `src/features/business/core/http/health.http` → prueba del health check (apunta al puerto 4000).
- Dependencias: express 5, cors, dotenv, morgan, sequelize 6, mysql2, pg, pg-hstore, tedious, oracledb; dev: typescript, ts-node, nodemon, @types/*.
- Scripts: `dev`, `build`, `start`. Sin tests ni linter.

## Entorno
- Motores en Docker: MySQL 3306, Postgres 5433, MSSQL 1433, Oracle XE 1521. `.env` activo: `DB_DIALECT=mysql`.
- El `.env` del usuario tiene las credenciales correctas: se usa tal cual y no se modifica.
- Conexiones verificadas con MySQL y Postgres.

## Aún no existe
- `src/routes/`, `src/swagger/`, `src/database/seeders/`, Faker, features de negocio.

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
- `health.http` usa el puerto 4000, pero el `.env` define 3002.

## Flujo por issue (estándar)
- Skill `.claude/skills/issue-flow/`: Claude mueve el tablero (Project 9), verifica DoD, genera evidencias PNG, commitea `feat(iss-XX)` + push, registra el hash en la trazabilidad, commitea `docs(iss-XX)` + push y cierra el issue. Sin trailers ni leyendas de IA.
- Tablero: campos Status (Preparado/En curso/Verificacion/Hecho), Size y Prioridad (P0–P2); metadatos en `scripts/sync_issue.py`.

## Próximo paso
- ISS-03: modelo, controller y rutas de Recycler; crear `src/routes/index.ts`; registrar el modelo y `sync()` en `config/index.ts`.
