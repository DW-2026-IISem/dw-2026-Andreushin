# MEMORY.md — Resumen ejecutivo CircularGuajira Backend

> Caché de contexto para cualquier IA/desarrollador. Máx. 50 líneas. Actualizar en cada cambio de código.
> Última actualización: 2026-10-03

## Estado actual
- Completadas **ISS-00** a **ISS-15** (16 / 17). Siguiente y última: **ISS-16** (verificación global de integridad y sincronización).

## Qué existe hoy
- `src/server.ts` → `App` + `listen()`. `src/config/index.ts` → clase `App`: PORT del `.env` (3002), middlewares, `GET /api/health`, importa modelos y luego asociaciones, rutas vía `Routes`, `setupSwagger()`, `dbConnection()` (conecta, `syncDatabase()`, `process.exit(1)` si falla).
- `src/database/db.ts` → fija `process.env.TZ = "UTC"` (si no, oracledb/tedious corren las fechas DATEONLY un día en hosts UTC-5); exporta `sequelize`, `getDatabaseInfo()`, `testConnection()`, `syncDatabase()` (alter salvo en MSSQL: solo crea tablas faltantes). Fail-fast de `DB_DIALECT` y `DB_<MOTOR>_*`.
- `src/shared/`: `utils/dates.ts` (hoy en America/Bogota, validación y resta de fechas `YYYY-MM-DD`), `validation/query-filters.ts` (`parseIdFilter`, `parseTextFilter`), `errors/app-error.ts` (NotFound 404, Validation 400, Conflict 409), `http/base-controller.ts` (`handle()`, `parseId()`; mapea `ForeignKeyConstraintError`/`UniqueConstraintError` de la BD a 409), `database/with-transaction.ts` (reintenta hasta 3 veces ante deadlock en los 4 motores), `database/decimal.ts`, `utils/numbers.ts` (`roundTo2`, `hasAtMostTwoDecimals`).
- Features en `src/features/business/<plural>/` (model, `dto/`, repository, service, controller, routes, seeder, swagger, `http/`; FKs en `*.associations.ts` con `NO ACTION`; las respuestas incluyen las entidades relacionadas):
  - `recyclers/` → `/api/recyclers` (unicidad `documentNumber`).
  - `routes/` → `/api/routes` (`municipality`, único `name+municipality`).
  - `collection-points/` → `/api/collection-points` (FK `routeId` activa, único `name+route_id`, `?routeId=`).
  - `collections/` → `/api/collections` (FKs `recyclerId`/`routeId` activos, `collectionDate` DATEONLY no futura (def. hoy), único `recycler+route+date`).
  - `materials/` → `/api/materials` (catálogo, `name` único; seeder con 10 materiales reales fijos, no aleatorios).
  - `material-rates/` → `/api/material-rates` (historial: `pricePerKg` DECIMAL, `validFrom`; crear/activar cierra la vigente anterior → 1 vigente por material, `previousRatesClosed`).
  - `plants/` → `/api/plants` (`name` único, `municipality`, `address`; `?municipality=`).
  - `material-lots/` → `/api/material-lots` (inventario: FKs `plantId`/`materialId`, código único, `weightKg` = existencias; no editable por PUT/PATCH (400); con existencias no cambia de planta/material (409)). Stock solo vía `material-lots.stock.ts` → `applyStockChange()` (deltas por lote en orden de id) → `adjustWeight()`: UPDATE atómico `weight_kg = weight_kg + Δ` con guarda `>= 0` (SELECT FOR UPDATE perdía actualizaciones en MSSQL).
  - `weighings/` → `/api/weighings` (FKs `collectionId`, `materialId`, `materialLotId` opcional del mismo material; neto = bruto − tara calculado en el servidor; crear/editar/anular/borrar ajusta el lote antes de escribir el pesaje (evita deadlock FK); 409 si el lote quedaría negativo). Seeder vía service.
  - `material-sales/` → `/api/material-sales` (FK `materialLotId`, `buyerName`, `saleDate`, total = cantidad × precio calculado; una venta activa descuenta del lote, 409 si no alcanza; anular/borrar devuelve). Seeder vía service. Sobreventa concurrente bloqueada en los 4 motores.
  - `settlements/` → `/api/settlements` (FK `recyclerId`; monto calculado = Σ pesajes del reciclador en `periodStart..periodEnd` × tarifa vigente en la fecha de cada jornada (MAX validFrom ≤ fecha); `state` pending→approved|rejected, approved→paid|rejected; solo pending edita período/reciclador (recalcula); aprobada/pagada no se anula ni borra; sin períodos solapados vigentes; `referenceCode` único, autogenerado).
- `src/swagger/`: `swagger.types.ts`, `swagger.helpers.ts`, `index.ts` (registry, `/api/health`, `Error`, respuestas comunes) → `/api/docs` y `/api/docs.json`.
- `src/database/seeders/`: `counts.ts` (camelCase, CLI `--tabla=N`) e `index.ts` (`SeedersRunner`, orden de FK) → `npm run db:seed`; idempotente.
- Dependencias: express 5, cors, dotenv, morgan, swagger-ui-express 5, sequelize 6, mysql2, pg, pg-hstore, tedious, oracledb; dev: typescript, ts-node, nodemon, @faker-js/faker 10, @types/*.
- Scripts: `dev`, `build`, `start`, `db:seed`. Sin tests ni linter. `.http` en puerto 3002.

## Entorno
- Docker: MySQL 3306, Postgres 5433, MSSQL 1433, Oracle XE 1521. `.env` activo: `DB_DIALECT=mysql`; probar otro motor con `DB_DIALECT=<motor>`.
- BD propias: `circularexpress_db` (MySQL), `circularexpress_psql` (PG), `circularexpress_sqlserver` (MSSQL), usuario/esquema Oracle `circularexpress` (XE). Las viejas `circularguajira_*` no se tocan.
- Credenciales del `.env`: no cambiarlas sin pedido del usuario.


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
- ISS-16: verificación global (revisar el ISS-16: `config/index.ts` consolidado, sync de las 11 tablas, Swagger con los 11 features, seed completo y prueba de extremo a extremo en los 4 motores).
