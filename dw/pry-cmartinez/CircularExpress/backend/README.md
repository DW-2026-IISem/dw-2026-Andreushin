# CircularGuajira — Express TS Backend API

API REST para la gestión integral de la cadena de suministro de reciclaje en La Guajira (recicladores, rutas, puntos de acopio, pesajes, lotes de clasificación, ventas y liquidaciones).

---

##  Stack Tecnológico

- **Runtime & Language:** Node.js (v20+) | TypeScript (v5+)
- **Framework:** Express 5
- **ORM & DB:** Sequelize (Soporte dinámico para MySQL, PostgreSQL, MSSQL, Oracle)
- **Documentación:** Swagger UI / OpenAPI 3.0 (`/api/docs`)
- **Testing Data:** `@faker-js/faker` (Seeders parametrizables)

---

##  Inicio Rápido

### 1. Requisitos Previos
- Node.js >= 20.0.0
- npm >= 10.0.0
- Instancia activa de Base de Datos (MySQL o PostgreSQL recomendados)

### 2. Instalación
```bash
git clone https://github.com/tu-usuario/app-circularguajira-express.git
cd app-circularguajira-express
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=circular_guajira_db
DB_USER=root
DB_PASSWORD=secret
```

---

##  Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo con recarga en vivo (`tsx`). |
| `npm run build` | Compila el código TypeScript a JavaScript en `dist/`. |
| `npm start` | Inicia el servidor compilado en modo producción. |
| `npm run seed` | Poblado sintético de la base de datos con Faker. |

---

##  Arquitectura Modular por Features

```text
src/
├── config/             # Configuración global y variables de entorno
├── database/           # Conexión Sequelize, sincronización y runner de seeders
├── features/
│   └── business/       # Módulos de dominio (recycler, route, collection, weighing, etc.)
│       └── <feature>/  # model, controller, routes, associations, seeder, swagger
├── routes/             # Agregador central de rutas REST
├── swagger/            # Registry global OpenAPI 3.0
└── server.ts           # Punto de entrada de la aplicación Express
```

---

##  Guía de Desarrollo por Issues

El proyecto incluye una metodología de desarrollo trazable guiada por IA o desarrolladores:
- **`prompt.md`**: Contexto del sistema y reglas de arquitectura.
- **`ISS-00` a `ISS-16`**: Incrementos de trabajo independientes con Criterios de Aceptación (DoR / DoD).

---

