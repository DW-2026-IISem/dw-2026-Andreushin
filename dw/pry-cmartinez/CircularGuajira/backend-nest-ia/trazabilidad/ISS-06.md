# ISS-06 — Feature `settlements` (Liquidaciones y Pesajes — Agregado Transaccional)

Issue #: _(completar al crear el issue en GitHub)_

## 1. Objetivo / Especificación
Registrar la liquidación de compra de material a un reciclador, con descuento automático de tara y actualización de inventario en planta, de forma **atómica** (todo o nada). No existe un paso previo de "pesaje pendiente": el `Settlement` se crea junto con sus `Weighing` en la misma operación.

- **Dominio:**
  - `Settlement` (`id`, `settlementDate`, `subtotal`, `discounts`, `total`, `status`, `recyclerId`, `items`)
  - `Weighing` (`id`, `settlementId`, `materialRateId`, `grossWeight`, `tareWeight`, `netWeight`, `pricePerKg`, `total`)
  - Servicio de dominio `SettlementCalculator`: `netWeight = grossWeight - tareWeight`; `subtotal = Σ (netWeight × pricePerKg)`
- **Aplicación:** `CreateSettlementDto` (`recyclerId` requerido, `items[]` con `grossWeight`, `tareWeight`, `materialRateId`).
- **Infraestructura (transacción):** `CreateSettlementUseCase` dentro de `sequelize.transaction`:
  1. Bloquea las filas de `material_rates` (`LOCK.UPDATE`)
  2. Valida existencia del `recycler` (`404`) y del `material-rate` (`404`)
  3. Ejecuta el pesaje y actualiza/acumula el inventario (`reduceStock` sobre el `material-rate`)
  4. Inserta `settlement` + `weighings`
  5. Ante cualquier falla, rollback total

## 2. Criterios de aceptación (AC)
| # | Criterio |
|---|---|
| AC1 | `POST /api/settlements` → `201` / `400` (items vacíos o peso inválido) / `404` (recycler o material-rate no encontrado) / `409` (conflicto de inventario) |
| AC2 | `GET /api/settlements/:id` → `200`, retorna cabecera + detalle de pesajes con tara |
| AC3 | `netWeight` se calcula siempre en el dominio (`grossWeight - tareWeight`); nunca se recibe del cliente |
| AC4 | La operación es atómica: cualquier fallo revierte settlement y weighings por igual |
| AC5 | Un settlement puede incluir uno o más weighings, cada uno con su propio `materialRateId` |

## 3. IA usada
_(completar durante la ejecución)_

## 4. Evidencias (EVI)
_(completar tras verificar)_

## 5. Revisión humana
_(completar)_

## 6. Gate
_(completar)_
