# CircularGuajira — Backend API (Express 5 + TypeScript + Sequelize)

API REST para la trazabilidad de la cadena de reciclaje en La Guajira: recicladores, rutas, puntos de acopio, jornadas, materiales y tarifas, plantas, lotes, pesajes, ventas y liquidaciones. Funciona sobre **MySQL, PostgreSQL, SQL Server y Oracle** con el mismo código.

---

## Stack

- **Node.js 20+**, **TypeScript 5** (modo estricto)
- **Express 5**
- **Sequelize 6** con `mysql2`, `pg`/`pg-hstore`, `tedious` y `oracledb`
- **Swagger UI / OpenAPI 3.0** en `/api/docs`
- **@faker-js/faker** para los seeders

---

## Inicio rápido

### 1. Requisitos
- Node.js >= 20 y npm >= 10
- Uno de los cuatro motores en ejecución (en este proyecto corren en Docker: MySQL 3306, PostgreSQL 5433, SQL Server 1433, Oracle XE 1521)

### 2. Instalación
```bash
npm install
```

### 3. Variables de entorno (`.env`)
El motor activo se elige con `DB_DIALECT`; solo el bloque `DB_<MOTOR>_*` de ese motor es obligatorio (validación fail-fast al arrancar).

```env
PORT=3002
NODE_ENV=development          # en development se registra el SQL en consola

DB_DIALECT=mysql              # mysql | postgres | mssql | oracle

DB_MYSQL_HOST=localhost
DB_MYSQL_PORT=3306
DB_MYSQL_USERNAME=usuario
DB_MYSQL_PASSWORD=secreto
DB_MYSQL_NAME=circularexpress_db

# Igual para DB_POSTGRES_*, DB_MSSQL_* y DB_ORACLE_* (en Oracle, NAME es el servicio, p. ej. XE)
```

Para probar otro motor sin editar el `.env`: `DB_DIALECT=postgres npm run dev`.

### 4. Arranque
```bash
npm run db:seed     # crea/actualiza las 11 tablas y siembra datos de ejemplo (idempotente)
npm run dev         # servidor con recarga en http://localhost:3002
```
Documentación interactiva: <http://localhost:3002/api/docs> (JSON en `/api/docs.json`).

---

## Scripts

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo (nodemon + ts-node). |
| `npm run build` | Compila a `dist/`. |
| `npm start` | Ejecuta el servidor compilado (`dist/server.js`). |
| `npm run db:seed` | Sincroniza el esquema y siembra datos; omite las tablas que ya tienen filas. |
| `npm run db:seed -- --fresh` | Borra y recrea las 11 tablas antes de sembrar (bloqueado con `NODE_ENV=production`). |
| `npm run db:seed -- --recyclers=25 --collection-points=40` | Cambia la cantidad de filas por tabla. |
| `npx tsc --noEmit` | Verificación de tipos. |

---

## Arquitectura

Cada entidad vive en su carpeta de feature y se organiza por capas; el flujo es siempre
`routes → controller → service → repository → model → Sequelize`.

```text
src/
├── server.ts
├── config/index.ts               # clase App: middlewares, rutas, Swagger, errores JSON, conexión y sync
├── database/
│   ├── db.ts                     # Sequelize multi-motor, syncDatabase(), proceso en UTC
│   ├── models.ts                 # registro único de modelos y asociaciones
│   └── seeders/                  # SeedersRunner (orden de FK) y conteos por tabla
├── routes/index.ts               # agregador de rutas
├── swagger/                      # registry OpenAPI, tipos y helpers
├── shared/                       # AppError, BaseController, withTransaction (reintenta deadlocks), utilidades
└── features/business/<plural>/
    ├── <singular>.model.ts
    ├── dto/
    ├── <plural>.repository.ts    # única capa que usa Sequelize
    ├── <plural>.service.ts       # reglas de negocio y transacciones
    ├── <plural>.controller.ts
    ├── <plural>.routes.ts
    ├── <plural>.associations.ts  # FKs (NO ACTION)
    ├── <plural>.seeder.ts
    ├── <plural>.swagger.ts
    └── http/                     # pruebas REST Client
```

Convenciones (detalle en `docs/prompt.MD` §3.4): código en inglés y camelCase (columnas en snake_case con `underscored: true`), rutas en plural (`/api/recyclers`), mensajes de la API en español.

---

## Endpoints

Todos los recursos exponen el mismo CRUD: `GET /api/<recurso>` (solo activos), `POST`, `GET /:id`, `PUT /:id`, `PATCH /:id`, `DELETE /:id` (borrado físico) y `PATCH /:id/deactivate` (baja lógica).

| Recurso | Ruta | Reglas destacadas |
| :--- | :--- | :--- |
| Recicladores | `/api/recyclers` | Documento único |
| Rutas | `/api/routes` | Nombre único por municipio |
| Puntos de acopio | `/api/collection-points` | Pertenecen a una ruta activa; `?routeId=` |
| Jornadas | `/api/collections` | Reciclador + ruta activos, fecha no futura, una por reciclador/ruta/día |
| Materiales | `/api/materials` | Catálogo con nombre único |
| Tarifas | `/api/material-rates` | Historial; crear/activar una tarifa cierra la vigente anterior del material |
| Plantas | `/api/plants` | Nombre único; `?municipality=` |
| Lotes | `/api/material-lots` | Inventario (`weightKg`) por planta y material; no se edita a mano |
| Pesajes | `/api/weighings` | Neto = bruto − tara; suma existencias al lote |
| Ventas | `/api/material-sales` | Total = cantidad × precio; descuenta existencias (409 si no alcanza) |
| Liquidaciones | `/api/settlements` | Monto = pesajes del período × tarifa vigente en cada fecha; flujo pending → approved → paid |
| Salud | `/api/health` | — |

Errores siempre en JSON: `400` datos inválidos o JSON mal formado, `404` recurso o ruta inexistente, `409` conflicto (duplicados, FKs, existencias, transiciones de estado).

Flujo completo de ejemplo: `src/features/business/core/http/e2e.http`.

---

## Desarrollo por issues

El proyecto se construyó de forma incremental y trazable: `docs/prompt.MD` (contexto y reglas) y `trazabilidad/ISS-00` … `ISS-16` (criterios de aceptación, evidencias y commit de cierre de cada incremento).
