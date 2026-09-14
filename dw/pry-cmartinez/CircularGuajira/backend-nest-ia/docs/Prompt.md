# Contrato de Arquitectura Backend — Pista Business (docs/Prompt.md)

Este documento constituye el **Contrato de Arquitectura** obligatorio para todo el desarrollo del backend bajo la metodología **SDD (Specification Driven Development) + Kanban + Asistencia IA con Revisión Humana**. Debe adjuntarse como contexto en cada interacción con la IA.

---

## 1. Naturaleza del Proyecto y Reglas de la Pista Business
- **Pista de desarrollo:** Backend exclusivamente de negocio (*Business*).
- **Alcance de la Semana 4:** Construcción de las capacidades de negocio mediante 7 tarjetas obligatorias (`ISS-01` a `ISS-07`).
- **Framework y Tecnologías:** NestJS (TypeScript, ESM `"type": "module"`), Sequelize ORM con `sequelize-typescript`, `class-validator`, `class-transformer`.

---

## 2. Clean Architecture por Feature (4 Capas Estrictas)
Cada módulo vertical en `src/features/business/<feature>/` se organiza en 4 capas físicas con regla de dependencia estricta hacia adentro:

```
presentation (HTTP / Controllers / DTOs)
       │
       ▼
application (Use Cases / Mappers)
       │
       ▼
   domain (Entidades Puras / Interfaces / Excepciones) ◄─── infrastructure (Models / Repositories)
```

1. **🟢 Domain (Dominio):**
   - Entidades puras (`.entity.ts`): Clases TypeScript puras **SIN** decoradores de Sequelize (`@Table`, `@Column`), **SIN** `extends Model` y **SIN** imports de NestJS/frameworks.
   - Puertos (`.repository.ts`): Interfaces TypeScript que definen el contrato de persistencia (ej. `IRecyclerRepository`).
   - Excepciones de dominio y servicios puros.

2. **🔵 Application (Aplicación):**
   - Casos de uso (`.use-case.ts`): Clases `@Injectable()` con método `execute()` que orquestan las reglas de negocio sobre las interfaces de dominio.
   - DTOs de entrada validados con `class-validator` y mappers bidireccionales.

3. **🟠 Infrastructure (Infraestructura):**
   - Modelos Sequelize (`.model.ts`): Clases con decoradores `@Table`, `@Column`, `@ForeignKey`, `@BelongsTo`.
   - Repositorios (`.repository.ts`): Implementación concreta de la interfaz de dominio usando Sequelize.
   - Seeders idempotentes (`.seeder.ts`).

4. **🟣 Presentation (Presentación):**
   - Controladores NestJS (`.controller.ts`): Exposición de rutas HTTP con decoradores de Swagger (`@ApiTags`, `@ApiOperation`).
   - Delegación directa a los casos de uso (sin lógica de persistencia ni reglas de negocio en los controladores).

---

## 3. Estructura de Carpetas Transversal
El workspace debe mantener la siguiente estructura física estándar:

```text
src/
├── main.ts                            # Bootstrap (prefijo /api, ValidationPipe, CORS, Swagger)
├── app.module.ts                      # Módulo raíz
├── config/                            # Carga y validación Fail-Fast de variables de entorno
│   └── environment/
│       ├── env.config.ts
│       ├── env.interface.ts
│       ├── env.validation.ts
│       └── db-env.ts
├── common/                            # Excepciones, filtros e interceptores globales
│   ├── exceptions/                    # ApplicationException, EntityNotFoundException, DomainException, BusinessRuleException
│   ├── filters/                       # GlobalExceptionFilter
│   └── interceptors/                  # ResponseInterceptor, LoggingInterceptor, TimeoutInterceptor
├── health/                            # Endpoint de salud GET /api/health
└── infrastructure/
    └── database/
        ├── sequelize/                 # sequelize.factory.ts (multi-motor) y sequelize.module.ts
        └── seeders/                   # Orquestador global (seeders.runner.ts)
```

---

## 4. Estándar de Contratos HTTP y Manejo de Errores
1. **Envelope de Respuesta Unificado (`ResponseInterceptor`):**
   Toda respuesta HTTP exitosa se envuelve en la siguiente estructura JSON:
   ```json
   {
     "statusCode": 200,
     "message": "OK",
     "data": { ... },
     "timestamp": "2026-09-13T22:00:00.000Z"
   }
   ```
2. **Listados Paginados:**
   Los listados deben retornar en `data`:
   ```json
   {
     "statusCode": 200,
     "message": "OK",
     "data": {
       "items": [ ... ],
       "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
     },
     "timestamp": "..."
   }
   ```
3. **Mapeo de Códigos de Estado HTTP:**
   - `200 OK`: Consultas exitosas (`GET`).
   - `201 Created`: Creación exitosa de recursos (`POST`).
   - `400 Bad Request`: Payload DTO inválido (`ValidationPipe`) o violación de regla básica de dominio (`DomainException`).
   - `404 Not Found`: Recurso o entidad inexistente (`EntityNotFoundException`).
   - `409 Conflict`: Violación de regla de negocio, duplicidad de clave única o conflicto de estado (`BusinessRuleException`).

---

## 5. Transacciones Atómicas (Sequelize Transactions)
- En operaciones compuestas que involucren múltiples tablas (ej. `settlements` / `weighing` / `sales`), **ES OBLIGATORIO** encapsular la operación dentro de una transacción Sequelize:
  `this.sequelize.transaction(async (t) => { ... })`.
- Debe aplicarse bloqueo pesimista en lectura/verificación cuando aplique: `{ lock: Transaction.LOCK.UPDATE, transaction: t }`.
- Cualquier fallo durante la ejecución provoca un **Rollback automático total**.

---

## 6. Variables de Entorno y Motores BD (`Instalacion Motores.md`)
Validación **Fail-Fast** en inicio según `DB_DIALECT`. Credenciales por defecto:

```env
PORT=3002
NODE_ENV=development
DB_DIALECT=mysql

# MySQL (Puerto 3306)
DB_MYSQL_HOST=localhost
DB_MYSQL_PORT=3306
DB_MYSQL_USERNAME=estudiante
DB_MYSQL_PASSWORD=462313
DB_MYSQL_NAME=circularguajira_db

# PostgreSQL (Puerto 5433)
DB_POSTGRES_HOST=localhost
DB_POSTGRES_PORT=5433
DB_POSTGRES_USERNAME=estudiante
DB_POSTGRES_PASSWORD=462313
DB_POSTGRES_NAME=circularguajira_db

# SQL Server (Puerto 1433)
DB_MSSQL_HOST=localhost
DB_MSSQL_PORT=1433
DB_MSSQL_USERNAME=estudiante
DB_MSSQL_PASSWORD=462313
DB_MSSQL_NAME=circularguajira_db

# Oracle XE (Puerto 1521)
DB_ORACLE_HOST=localhost
DB_ORACLE_PORT=1521
DB_ORACLE_USERNAME=estudiante
DB_ORACLE_PASSWORD=462313
DB_ORACLE_NAME=XE
```

---

## 7. Prohibiciones y Restricciones Duras
1. **EXCLUSIÓN TOTAL DE AUTENTICACIÓN Y SEGURIDAD:** Prohibido implementar `Auth`, `Users`, `JWT`, `passport`, `bcrypt`, `login` o `RBAC` en esta entrega de Semana 4.
2. **PROHIBIDO ALTERAR/BORRAR BD AUTOMÁTICAMENTE:** Estrictamente prohibido usar `sync({ force: true })` o `sync({ alter: true })`. Usar únicamente `sync({ alter: false })`.
3. **PROHIBIDO ADELANTAR ISSUES:** Se debe trabajar un solo Issue a la vez (WIP = 1) en orden estricto de dependencias (`ISS-01` → `ISS-07`).
4. **PROHIBIDO COMMITEAR ARCHIVOS DE ENTORNO:** El archivo `.env` nunca se incluye en el control de versiones (debe estar en `.gitignore`). `.env.example` sí se versiona.
