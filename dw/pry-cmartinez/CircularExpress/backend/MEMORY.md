# MEMORY.md — Resumen ejecutivo CircularGuajira Backend

> Caché de contexto para cualquier IA/desarrollador. Máx. 50 líneas. Actualizar en cada cambio de código.
> Última actualización: 2026-09-30

## Estado actual
- Issue completada: **ISS-01** (esqueleto Express 5 + TS). Siguiente: **ISS-02** (infraestructura DB).
- Progreso: 1 / 16 issues (ISS-00 entorno se asume verificado).

## Qué existe hoy
- `src/server.ts` → crea `App` y llama `listen()`.
- `src/config/index.ts` → clase `App`: settings (PORT, default 4000), middlewares (morgan, cors, json, urlencoded), `GET /api/health`.
- `routes()` y `dbConnection()` son stubs con marcadores `// ISS-03 §4.3` y `// ISS-02 / ISS-03`.
- `src/features/business/core/http/health.http` → prueba del health check.
- Dependencias: express 5, cors, dotenv, morgan; dev: typescript, ts-node, nodemon, @types/*.
- Scripts: `dev`, `build`, `start`. Sin tests ni linter.

## Aún no existe
- Sequelize + drivers, `src/database/`, `src/routes/`, `src/swagger/`, Faker, features de negocio.

## Decisiones y desviaciones respecto a los ISS
- `.env` usa `DB_DIALECT` + bloques `DB_<MOTOR>_HOST/PORT/USERNAME/PASSWORD/NAME` (mysql, postgres, mssql, oracle) con validación fail-fast del motor activo. El `db.ts` de ISS-02 usa otros nombres (`DB_ENGINE`, `MYSQL_HOST`...): adaptar el código al `.env`, no al revés.
- `cors` se importa con `import` (no `require` como en ISS-01).
- Health check añadido en ISS-01 aunque el ISS no lo incluía explícitamente.

## Pendientes / problemas conocidos
- README desactualizado: menciona `tsx`, `npm run seed` y variables `DB_HOST`.
- Ruta de recicladores sin definir: `/api/recicladores` (ISS-03) vs `/api/<feature>s` (prompt maestro).
## Próximo paso
- ISS-02: instalar Sequelize + drivers, crear `src/database/db.ts` (`sequelize`, `getDatabaseInfo`, `testConnection`) leyendo el `.env` actual; verificar con `npx tsc --noEmit`.
