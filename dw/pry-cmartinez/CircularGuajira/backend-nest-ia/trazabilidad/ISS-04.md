# ISS-04 — Feature `materials` (Clasificación de Materiales)

Issue #: _(completar al crear el issue en GitHub)_

## 1. Objetivo / Especificación
Clasificar los tipos de material reciclable aceptados en planta (Plástico PET, Chatarra, Cobre, Cartón, Vidrio, etc.). **Solo catálogo/clasificación — sin precio ni stock** (eso vive en ISS-05, `material-rates`).

- **Dominio:** entidad pura `Material` (`id`, `name`, `code`, `description`, `status`). Interfaz `IMaterialRepository`.
- **Aplicación:** `CreateMaterialDto` (`name` requerido y único). Casos de uso `CreateMaterial`, `ListMaterials`, `GetMaterialById`.
- **Infraestructura:** `MaterialModel` (tabla `materials`), `MaterialSeeder` idempotente por `name`.

## 2. Criterios de aceptación (AC)
| # | Criterio |
|---|---|
| AC1 | `POST /api/materials` → `201` / `400` / `409` (`name` duplicado) |
| AC2 | `GET /api/materials` → `200` |
| AC3 | `GET /api/materials/:id` → `200` / `404` |
| AC4 | `name` es único a nivel de dominio |
| AC5 | Esta entidad no expone ni almacena `pricePerKg` ni `stockKg` |

## 3. IA usada
_(completar durante la ejecución)_

## 4. Evidencias (EVI)
_(completar tras verificar)_

## 5. Revisión humana
_(completar)_

## 6. Gate
_(completar)_
