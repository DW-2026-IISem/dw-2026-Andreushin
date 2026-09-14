# ISS-01 — Esqueleto NestJS CA arrancable

Issue #: Issue GitHub: backend-nest-ia #2

## 1. Objetivo / Especificación
Disponer de la estructura base versionada en Git para el backend de CircularGuajira bajo Clean Architecture, **sin base de datos**.

**Estructura de carpetas:** `src/config/`, `src/common/`, `src/infrastructure/database/`, `src/features/business/`

**Regla dura:** prohibido incluir Sequelize, modelos o controladores de negocio en este issue.

## 2. Criterios de aceptación (AC)
| # | Criterio |
|---|---|
| AC1 | El proyecto arranca sin errores con `npm run start:dev` |
| AC2 | Existe exactamente la estructura: `src/config/`, `src/common/`, `src/infrastructure/database/`, `src/features/business/` |
| AC3 | `GET /api/health` → `200 {"status": "ok"}` |
| AC4 | No hay ningún modelo Sequelize, controlador de negocio ni dependencia de BD instalada/usada en este issue |
| AC5 | README inicial con instrucciones de instalación |

## 3. IA usada
_(completar durante la ejecución)_

## 4. Evidencias (EVI)
_(completar tras verificar)_

## 5. Revisión humana
_(completar)_

## 6. Gate
_(completar)_
