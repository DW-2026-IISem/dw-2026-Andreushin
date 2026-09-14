# CircularGuajira — Backend (Pista Business)

Backend de negocio del proyecto CircularGuajira, construido con [NestJS](https://nestjs.com/) siguiendo Clean Architecture. Ver el contrato de arquitectura completo en [`docs/Prompt.md`](docs/Prompt.md) y la trazabilidad de issues en [`trazabilidad/`](trazabilidad/).

> **Estado (ISS-01):** esqueleto base arrancable, sin base de datos. Ver [`trazabilidad/ISS-01.md`](trazabilidad/ISS-01.md).

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Ejecución en desarrollo

```bash
npm run start:dev
```

Este comando libera automáticamente el puerto configurado (`free:port`) antes de arrancar Nest en modo `--watch`.

El servidor queda disponible en `http://localhost:3002` (o el valor de la variable de entorno `PORT`), con prefijo global `/api`.

## Verificar que el servidor está vivo

```bash
curl http://localhost:3002/api/health
```

Respuesta esperada:

```json
{ "status": "ok" }
```

## Otros scripts

| Script | Descripción |
|---|---|
| `npm run start` | Arranca Nest sin watch mode |
| `npm run start:dev` | Libera el puerto y arranca en modo watch |
| `npm run build` | Compila el proyecto a `dist/` |
| `npm run start:prod` | Ejecuta el build compilado |
| `npm run free:port` | Libera el puerto configurado (`PORT`, por defecto 3002) si está ocupado |
| `npm run test` | Ejecuta las pruebas unitarias |
| `npm run test:e2e` | Ejecuta las pruebas end-to-end |
| `npm run lint` | Corre el linter |

## Estructura de carpetas (Clean Architecture)

```
src/
├── main.ts                       # Bootstrap: prefijo /api, CORS, ValidationPipe
├── app.module.ts                 # Módulo raíz
├── app.controller.ts             # Endpoint GET /api/health
├── config/                       # Configuración y variables de entorno (issues siguientes)
├── common/                       # Excepciones, filtros e interceptores transversales (issues siguientes)
├── infrastructure/
│   └── database/                 # Infraestructura de persistencia (issues siguientes)
└── features/
    └── business/                 # Módulos de negocio (Clean Architecture por feature)
```

## Fuera de alcance en ISS-01

- Conexión a base de datos, Sequelize u otro ORM.
- Autenticación, autorización, usuarios, JWT o RBAC.
- Lógica de negocio dentro de `features/business`.

Ver el detalle completo en [`trazabilidad/ISS-01.md`](trazabilidad/ISS-01.md).
