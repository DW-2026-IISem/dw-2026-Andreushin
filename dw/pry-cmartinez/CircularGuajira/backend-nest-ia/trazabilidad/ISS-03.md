# ISS-03 — Feature `recyclers` (Recicladores — Maestro Base)

Issue #: _(completar al crear el issue en GitHub)_

## 1. Objetivo / Especificación
Registrar y consultar los recicladores u organizaciones del sistema de abastecimiento de recolección.

- **Dominio:** entidad pura `Recycler` (`id`, `name`, `document`, `phone`, `address`, `status`). Interfaz `IRecyclerRepository`.
- **Aplicación:** casos de uso `CreateRecycler`, `ListRecyclers`, `GetRecyclerById`. DTO `CreateRecyclerDto` (`name` requerido, `document` único si se envía).
- **Infraestructura:** `RecyclerModel` (tabla `recyclers`), repositorio Sequelize, `RecyclerSeeder` idempotente por `document` o `name`.

## 2. Criterios de aceptación (AC)
| # | Criterio |
|---|---|
| AC1 | `POST /api/recyclers` → `201` / `400` (DTO inválido) / `409` (`document` duplicado) |
| AC2 | `GET /api/recyclers` → `200`, lista paginada en `data.items` |
| AC3 | `GET /api/recyclers/:id` → `200` / `404` |
| AC4 | `document` es opcional pero único cuando se proporciona |
| AC5 | `RecyclerSeeder` no duplica registros si ya existen (idempotente) |

## 3. IA usada
_(completar durante la ejecución)_

## 4. Evidencias (EVI)
_(completar tras verificar)_

## 5. Revisión humana
_(completar)_

## 6. Gate
_(completar)_
