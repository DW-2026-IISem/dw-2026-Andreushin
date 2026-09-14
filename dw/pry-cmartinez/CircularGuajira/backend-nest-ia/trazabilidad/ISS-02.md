# ISS-02 — Entorno Sequelize y Módulo Common

Issue #: _(completar al crear el issue en GitHub)_

## 1. Objetivo / Especificación
Validar variables de entorno para la base de datos `circularguajira_db`, fábrica Sequelize multi-dialecto, filtro global de excepciones e interceptores.

**Especificación:**
- Validar variables de entorno críticas del dialecto activo al arrancar (fail-fast).
- Configurar Sequelize con `sync({ alter: false })`.
- `ResponseInterceptor` envuelve toda respuesta exitosa en `{ statusCode, message, data, timestamp }`.
- Excepciones base: `ApplicationException`, `EntityNotFoundException` (404), `DomainException` (400), `BusinessRuleException` (409).

## 2. Criterios de aceptación (AC)
| # | Criterio |
|---|---|
| AC1 | La app falla rápido y con mensaje claro si falta una variable de entorno crítica del dialecto activo |
| AC2 | Sequelize conecta con `sync({ alter: false })` según el dialecto configurado |
| AC3 | Toda respuesta exitosa pasa por `ResponseInterceptor` con forma `{ statusCode, message, data, timestamp }` |
| AC4 | `EntityNotFoundException`, `DomainException`, `BusinessRuleException` existen y mapean a 404/400/409 respectivamente vía filtro global |
| AC5 | `.env.example` en el repo; `.env` real en `.gitignore` |

## 3. IA usada
_(completar durante la ejecución)_

## 4. Evidencias (EVI)
_(completar tras verificar)_

## 5. Revisión humana
_(completar)_

## 6. Gate
_(completar)_
