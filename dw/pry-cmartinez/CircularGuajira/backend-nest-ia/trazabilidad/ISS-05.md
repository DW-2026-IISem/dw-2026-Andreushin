# ISS-05 — Feature `material-rates` (Tarifas y Control de Stock en Kg)

Issue #: _(completar al crear el issue en GitHub)_

## 1. Objetivo / Especificación
Registrar el precio por kilogramo y el volumen acumulado de cada material, protegiendo las variaciones de inventario mediante reglas de dominio. Depende de `materials` (ISS-04).

- **Dominio:** entidad pura `MaterialRate` (`id`, `name`, `pricePerKg`, `minStockKg`, `stockKg`, `materialId`, `status`) con métodos de dominio `reduceStock(kg)` / `accumulateStock(kg)`; `reduceStock` lanza `InsufficientStockException` si el inventario quedaría negativo.
- **Aplicación:** `CreateMaterialRateDto` (`pricePerKg` > 0, `materialId` requerido). `CreateMaterialRateUseCase` valida que `materialId` exista (`404` si no) y esté activo (`409` si inactivo).
- **Infraestructura:** `MaterialRateModel` (tabla `material_rates`, FK `@ForeignKey(() => MaterialModel)`).

## 2. Criterios de aceptación (AC)
| # | Criterio |
|---|---|
| AC1 | `POST /api/material-rates` → `201` / `400` / `404` (material inexistente) / `409` (material inactivo) |
| AC2 | `GET /api/material-rates` → `200` |
| AC3 | `GET /api/material-rates/:id` → `200` / `404` |
| AC4 | `pricePerKg` debe ser mayor a 0 (validación de dominio) |
| AC5 | `reduceStock(kg)` lanza `InsufficientStockException` si el inventario resultante sería negativo |

## 3. IA usada
_(completar durante la ejecución)_

## 4. Evidencias (EVI)
_(completar tras verificar)_

## 5. Revisión humana
_(completar)_

## 6. Gate
_(completar)_
