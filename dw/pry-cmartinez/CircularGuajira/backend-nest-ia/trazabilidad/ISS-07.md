# ISS-07 — Integración Business y Demo CircularGuajira

Issue #: _(completar al crear el issue en GitHub)_

## 1. Objetivo / Especificación
Demostrar la trazabilidad completa del ciclo de reciclaje en una base de datos limpia mediante un script reproducible.

- **Orquestador de seeders**, en orden estricto de dependencias: `Recyclers` → `Materials` → `MaterialRates`.
- **README** con guía de ejecución de la demo: Crear Reciclador → Crear Material → Registrar Tarifa y Stock → Registrar Liquidación con Pesaje y Tara → Verificar actualización de inventario.
- **Swagger** activo en `/api/docs` con los 4 recursos: `recyclers`, `materials`, `material-rates`, `settlements`.

## 2. Criterios de aceptación (AC)
| # | Criterio |
|---|---|
| AC1 | `npm run seed` carga `Recyclers`, `Materials` y `MaterialRates`, en ese orden, sin errores |
| AC2 | La guía/script de demo ejecuta el flujo completo y verifica que `stockKg` se actualizó tras la liquidación |
| AC3 | Swagger en `/api/docs` documenta `recyclers`, `materials`, `material-rates` y `settlements` |
| AC4 | README explica instalación, variables de entorno y ejecución de la demo |

## 3. IA usada
_(completar durante la ejecución)_

## 4. Evidencias (EVI)
_(completar tras verificar)_

## 5. Revisión humana
_(completar)_

## 6. Gate
_(completar)_
