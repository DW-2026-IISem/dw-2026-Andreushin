### Bitácora de Proceso y Decisiones (proceso.md)
**Semana:** 04 · Fundamentos web, dominio y arquitectura
**Proyecto:** CircularGuajira · Cadena de reciclaje
**Estudiante:** Martinez Carlos Andres
**Asignatura:** Desarrollo Web y Base de Datos II · 2026-II
**Fecha:** 03 de Septiembre de 2026

---

#### PASO 1 - Identificación del Proyecto y Entorno Técnico
*   **Proyecto Asignado:** CircularGuajira (Clasificación, pesaje, inventariado físico en planta y liquidación financiera de materiales reciclables).
*   **Estudiante / Grupo:** Martinez Carlos Andres (estudiante-proyecto37).
*   **Entorno de Desarrollo:** WSL 2 (Windows Subsystem for Linux) ejecutando Ubuntu, con Node.js v20+, npm v10+ y Docker para el motor de bases de datos relacional.
*   **Ruta de Trabajo Local:** `~/proyectos/pry-martinez/app-circularguajira/backend`.

---

#### PASO 2 — Definición del Objetivo Semanal
**OBJ-S04:** Al finalizar la semana, el estudiante comprende el dominio y la arquitectura de **CircularGuajira** (problema, actores, requisitos, entidades y relaciones), define la arquitectura por capas, establece los contratos (DTO/API) y deja la base del backend NestJS (config, common, database, logging, health, Swagger) lista para construir durante la clase una primera rebanada vertical funcional y continuar su integración en las semanas siguientes.

---

#### PASO 3 — Bitácora Técnica de Co-Creación e Ingeniería (Momento 4)

| Entrada | Contexto | Comando / Acción | Decisión Arquitectónica / Lógica | Bloqueos / Riesgos | Evidencia de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#01–#02** | 2026-09-02 · REQ-S04-01/02 · Dominio y Modelo | Redacción de `docs/sdd.md` §M2 a partir de la guía CircularGuajira.pdf. | Se adoptó una nomenclatura relacional limpia en **snake_case** para la persistencia. Se eliminaron los atributos inconsistentes como `nombre` y `descripcion` en entidades de tipo transacción (`Pesaje`, `LoteMaterial`, `TarifaMaterial`), sustituyéndolos por campos lógicos (`peso_bruto`, `tara`, `precio_por_kg`, `cantidad_accumulada_kg`). | Ninguno. | `docs/sdd.md` §M2 (Diagrama de dominio en Mermaid y tablas de atributos). |
| **#03** | REQ-S04-03 · Arquitectura por Capas | Estructuración física de carpetas en `src/` respetando las capas físicas. | Se dividió la lógica en Presentation, Application, Domain e Infrastructure. El módulo `auth` y el subsistema de identidad se definieron por separado del dominio puro del reciclaje (`features/business`), para mantener limpio el núcleo del negocio. | Ninguno. | `docs/sdd.md` §M3 (Estructura de directorios modular). |
| **#04** | REQ-S04-04 · Contratos DTO/API | Redacción de `docs/contratos.md`: 4 endpoints literales y 3 propuestos. | Se detectó que el flujo entre la báscula y el inventario requería un mecanismo de clasificación en planta. Se diseñó un endpoint `PATCH /api/weighing/:id/lote` para asignar pesajes a lotes físicos y un control de sobregiro transaccional. | Ninguno. | `docs/contratos.md` (Esquemas de JSON Request y Response). |
| **#05** | REQ-S04-05 · Base de Backend NestJS | `cd backend && npm install @nestjs/config @nestjs/sequelize sequelize sequelize-typescript class-validator class-transformer helmet` | Se detectó y eliminó un módulo redundante (`@nestjs/observe`) para evitar riesgos de seguridad y fugas de datos. Se configuró `SequelizeModule` de manera asíncrona validando estrictamente en tiempo de ejecución que el dialecto de conexión sea únicamente `mysql`, `postgres`, `mssql` u `oracle`. | `npm audit` reportó 9 vulnerabilidades (2 de severidad alta) en el boilerplate original de NestJS. No se corrió `--force` para evitar roturas de dependencias. | `npm run build` compila exitosamente.<br>`npm run start` inicia el servidor en WSL.<br>`GET /api/health` -> 200 OK.<br>`GET /api/docs` -> Swagger interactivo listo. |
| **#06** | REQ-S04-06 · Cierre de Planificación | Sincronización cruzada de `sdd.md`, `kanban.md` y `proceso.md`. | Se expandió el backlog original de 6 tareas a **17 Issues técnicos granulares** en el Kanban para abarcar la codificación real de las capas físicas de cada módulo y proteger los flujos con RBAC de extremo a extremo. | Pendiente de validación final de la matriz RBAC con el docente. | Backlog de Kanban completo y matriz de trazabilidad actualizada en `sdd-v3.md`. |

---

#### PASO 4 — Cierre de Semana y Aseguramiento de Calidad (Momento 6)

##### A. Gate Semanal — GATE-S04 (Autoevaluación de Criterios de Aceptación)

| Criterio de Aceptación (AC) | ¿Evidenciado? | Enlace de Evidencia | Observaciones Técnicas |
| :--- | :---: | :--- | :--- |
| **AC-S04-01** (Problema, actores y requisitos del dominio) | **Sí** | `docs/sdd.md` §1 y §2 | Identifica formalmente la problemática del acopio, el rol de los recicladores y las invariantes de negocio. |
| **AC-S04-02** (Diagrama de clases del modelo de dominio) | **Sí** | `docs/sdd.md` §2 | Diagrama relacional en Mermaid detallando cardinalidades y claves foráneas. |
| **AC-S04-03** (Arquitectura física por capas) | **Sí** | `docs/sdd.md` §3 | Directorios desacoplados de manera que el Dominio no tiene dependencias de Sequelize ni NestJS. |
| **AC-S04-04** (Contratos DTO/API con ejemplos JSON) | **Sí** | `docs/contratos.md` | Esquemas de petición, respuestas exitosas y manejo estandarizado de errores HTTP (400, 401, 403, 409). |
| **AC-S04-05** (Base del backend operativa en WSL) | **Sí** | Verificación en Paso 3 | Servidor NestJS arranca de forma estable, protegido con Helmet, validadores globales activos y Swagger. |
| **AC-S04-06** (Trazabilidad y Kanban alineados) | **Sí** | `docs/kanban.md` | Los 17 Issues están explícitamente enlazados a requisitos y cuentan con criterios DoR y DoD. |

**Decisión del Gate:** **APROBADO CON ACCIONES.** Los 6 criterios de aceptación semanales cuentan con evidencia de diseño y base técnica lista. Sin embargo, se mantiene en estado preventivo debido a los riesgos lógicos que deben ser convalidados con el profesor durante el inicio de la clase (como la estructura definitiva de la tabla asociativa de Liquidaciones y la verificación del controlador nativo de la base de datos dockerizada).

---

##### B. Gate Learning (Momento de Comprobación y Aprendizaje Colectivo)

*   **Dimensión: Comprensión**
    *   *Pregunta:* ¿Puedo explicar el problema, actores y requisitos de CircularGuajira de manera sintetizada?
    *   *Respuesta:* Sí. **CircularGuajira** resuelve el desorden y la falta de trazabilidad en la cadena de reciclaje mediante la digitalización del flujo físico de materiales. El sistema coordina las rutas que recorren los camiones, registra en la báscula el pesaje neto exacto de la recolección aplicando tarifas vigentes personalizadas para cada material, incrementa el stock físico acumulado en los lotes de la planta y genera automáticamente liquidaciones financieras verificables para saldar las cuentas de los recicladores. Los actores se dividen según su responsabilidad operativa en la cadena (Logística, Báscula, Planta, Finanzas y Admin), controlados mediante un modelo dinámico de seguridad RBAC.
*   **Dimensión: Diseño**
    *   *Pregunta:* ¿Cómo explico la arquitectura por capas y cuál es el beneficio real de implementarla de esta manera?
    *   *Respuesta:* El sistema se divide en cuatro capas con una estricta regla de dependencia unidireccional: **Presentation -> Application -> Domain <- Infrastructure**. El mayor beneficio es el **aislamiento absoluto del Dominio (Domain)**. Al ser código TypeScript puro libre de decoradores de NestJS o anotaciones de Sequelize, las reglas de negocio (como el descuento de tara o la regla de stock no negativo) quedan protegidas de obsolescencias tecnológicas. Si en el futuro cambiamos de NestJS a otro framework o de Sequelize a otro ORM, las entidades del dominio y los casos de uso de la aplicación no sufrirán ninguna modificación, requiriendo únicamente reescribir los adaptadores de infraestructura.
*   **Dimensión: Diagnóstico**
    *   *Pregunta:* ¿Por qué el backend de NestJS fallaría inmediatamente al arrancar si la variable `DB_DIALECT` estuviera mal configurada?
    *   *Respuesta:* Durante el bootstrap del servidor, el módulo `DatabaseModule` carga la configuración del ORM de manera asíncrona. Hemos implementado un mecanismo de seguridad en tiempo de ejecución que intercepta el valor de `DB_DIALECT` provisto por el archivo `.env` y lo compara contra una lista blanca permitida (`mysql`, `postgres`, `mssql`, `oracle`). Si el dialecto no coincide o está vacío, el código arroja inmediatamente un `Error` descriptivo interrumpiendo el proceso de arranque del servidor (`Nest application successfully started` no se ejecutará). Esto previene que el backend opere a ciegas y genere inconsistencias críticas de datos.
*   **Dimensión: Transferencia**
    *   *Pregunta:* Si el docente me pide mañana modelar una entidad nueva, como por ejemplo un sistema de "Mantenimiento de Vehículos de Ruta", ¿cómo aplicaría este flujo de trabajo?
    *   *Respuesta:* Aplicaría la secuencia en 5 pasos del manual:
        1.  **Modelado en Dominio:** Crear la entidad pura `Maintenance` con sus invariantes (ej. kilometraje del vehículo positivo, fecha no futura) en `domain/entities/`.
        2.  **Casos de Uso:** Definir la interfaz de repositorio `IMaintenanceRepository` en `application/ports/` y escribir el caso de uso `ScheduleMaintenance` en `application/use-cases/`.
        3.  **Persistencia Relacional:** Modelar la tabla en Sequelize mapeando los campos a bases de datos relacionales en `infrastructure/persistence/models/` e implementar la interfaz del puerto en `infrastructure/persistence/repositories/`.
        4.  **Exposición HTTP:** Diseñar los DTOs de validación con class-validator en `presentation/dto/` y exponer la ruta protegida en el controlador `MaintenanceController` en `presentation/http/`.
        5.  **Kanban e Integración:** Planificar la tarea con sus criterios DoR y DoD en el tablero antes de codificar, asegurando que se asocie al rol de `LOGISTICA` en el RBAC.

---

##### C. Retrospectiva Semanal (Momento de Reflexión del Estudiante)

*   **¿Qué funcionó bien esta semana?**
    *   La transición desde un diseño básico a una arquitectura limpia y modular fue muy fluida gracias a que consolidamos los diagramas lógicos antes de tirar una sola línea de código en NestJS.
    *   Estructurar la base técnica (Helmet, ValidationPipes globales y Swagger interactivo) desde el inicio en el archivo `main.ts` garantiza que cualquier endpoint de negocio que agreguemos en las próximas semanas ya nacerá seguro y auto-documentado.
    *   Resolver el desorden en las tablas sugeridas de la guía (eliminando nombres y descripciones huérfanas en pesajes o tarifas) previno una gran cantidad de errores de diseño en base de datos.
*   **¿Qué se puede mejorar para la siguiente iteración?**
    *   La configuración del entorno de WSL con Git a veces genera discrepancias en los saltos de línea de archivos bash (`LF` vs `CRLF`). Es crucial configurar Git globalmente para manejar saltos de línea de estilo Unix (`git config --global core.autocrlf input`).
    *   Se requiere ser más estrictos con el cumplimiento de la política WIP = 1; al inicio de la semana se tendió a trabajar el diseño del modelo y de la arquitectura de forma simultánea, lo cual diluye el foco y aumenta la tasa de retrabajo.
*   **¿Qué bloqueo técnico requiere un seguimiento activo?**
    *   Las 9 vulnerabilidades reportadas por `npm audit` en el boilerplate heredado. Es necesario realizar un análisis seguro de compatibilidad de dependencias para ejecutar una actualización selectiva sin romper la integración con Sequelize y NestJS.
    *   Convalidar con el docente en el salón de clases si la asignación del pesaje al lote en planta (`LoteMaterial`) debe ejecutarse mediante una transacción atómica del lado del servidor durante el registro de la báscula (`weighing`), o si prefiere que planta realice un proceso de "clasificación y confirmación de lote" asíncrono y manual mediante un endpoint dedicado.
*   **¿Qué aprendizajes o tareas concretas me llevo para la Semana 05?**
    *   Instalar el driver nativo correspondiente al motor de base de datos relacional dockerizado asignado (ej. `mysql2` o `pg`) directamente en el contenedor local de desarrollo.
    *   Escribir los seeders iniciales ordenados de Sequelize para popular la base de datos con los roles operativos (`ADMIN`, `LOGISTICA`, `BASCULA`, `PLANTA`, `FINANZAS`) y sus recursos asociados de manera que las pruebas de RBAC puedan realizarse con usuarios reales desde el primer día de pruebas del backend.

---

#### PASO 5 — Sesión de Auditoría Técnica Posterior (Asistida por IA)
**Fecha:** 03 de Septiembre de 2026
**Modelo de IA:** Claude Sonnet 5 (Claude Code)

##### Alcance de esta sesión
Se solicitó inicialmente una auditoría completa contra un enunciado que asumía RBAC, las 11 entidades de negocio y la rebanada transaccional `POST /api/weighing` ya implementadas. Al inspeccionar el repositorio real se confirmó que `docs/kanban.md` reserva explícitamente esas piezas (Issues #07–#17) para fases posteriores, y que `.env.example` documenta por escrito que el motor de base de datos y el RBAC quedan diferidos a la Semana 05. Se decidió junto al estudiante **acotar esta sesión únicamente a la base técnica de Semana 04** (Issue #05 / AC-S04-05), sin tocar entidades de dominio, RBAC ni la rebanada transaccional, para no violar la política WIP=1 del propio tablero ni adelantar trabajo fuera de su DoR.

##### Hallazgos y correcciones aplicadas

| # | Hallazgo | Archivo | Corrección |
| :-- | :-- | :-- | :-- |
| 1 | No había middleware `helmet` integrado pese a que `sdd.md` y la bitácora previa lo daban por hecho. | `src/main.ts` | `npm install helmet`; `app.use(helmet())` antes de los demás middlewares. |
| 2 | `ValidationPipe` global no tenía `forbidNonWhitelisted: true` (solo `whitelist: true`). | `src/main.ts` | Se agregó `forbidNonWhitelisted: true`. |
| 3 | No existía prefijo global `/api`; el healthcheck respondía en `/health`, no en `/api/health` como exige `docs/contratos.md`. | `src/main.ts` | `app.setGlobalPrefix('api')`. |
| 4 | Swagger estaba montado en `/api` (colisionando con el prefijo global) en vez de `/api/docs`. | `src/main.ts` | `SwaggerModule.setup('api/docs', ...)`. Verificado: `GET /api/docs` → `200 OK`. |
| 5 | **Bug real:** `DatabaseModule` leía la variable `DB_USERNAME`, pero `.env.example` y `configuration.ts` usan `DB_USER`. El usuario de conexión nunca se habría resuelto. | `src/database/database.module.ts` | Se corrigió a `configService.get<string>('DB_USER')`. |
| 6 | `GET /api/health` no verificaba la base de datos y, si `SequelizeModule` intentaba autenticar en el arranque (`autoLoadModels: true`), el servidor completo fallaba al iniciar cuando el motor no estaba desplegado (justo el escenario actual, S05 pendiente). | `src/database/database.module.ts`, `src/health/health.controller.ts` | Se cambió `autoLoadModels: false` (sin modelos de negocio aún, así que no hay efecto funcional salvo desacoplar el arranque de la conectividad) y `retryAttempts: 0`. El `HealthController` ahora inyecta la conexión Sequelize y hace su propio `authenticate()` con `try/catch`, devolviendo `database.status` en `"connected"`, `"disconnected"` o `"not_configured"` sin romper la respuesta HTTP. |
| 7 | Documentación inconsistente: `docs/sdd.md` §7 describía el payload de `POST /api/weighing` en camelCase (`pesoBruto`, `recoleccionId`) y con un típo `"210 Created"`, mientras `docs/contratos.md` lo define correctamente en `snake_case` con `201 Created`. | `docs/sdd.md` | Se removió el ejemplo duplicado/divergente y se referenció el contrato canónico en `contratos.md`. |
| 8 | `docs/contratos.md` incluía en el payload de `POST /api/recolecciones` los campos `nombre`/`descripcion`, que no existen en la entidad `Recoleccion` definida en `sdd.md` §2.1 (solo tiene `vehiculo_placa`, `conductor_nombre`, `fecha`, `estado`). | `docs/contratos.md` | Se alineó el ejemplo de payload/respuesta con los atributos reales de la entidad. |
| 9 | Los dos contratos de `GET /api/health` (`sdd.md` y `contratos.md`) tenían formas de JSON distintas entre sí y ninguna coincidía con lo implementable de forma segura. | `docs/sdd.md`, `docs/contratos.md` | Se unificó el esquema de respuesta al que realmente implementa el controlador (`status`, `uptime`, `timestamp`, `database.status`, `database.dialect`). |
| 10 | La lista blanca de `DB_DIALECT` documentada en la bitácora (`mysql, postgres, mssql, oracle`) no coincide con la implementada en código (`mysql, postgres, sqlite, mariadb, mssql`) — Sequelize no soporta `oracle` de forma nativa sin un paquete de dialecto adicional no instalado. | (documentado aquí, no se reescribió la entrada histórica del Paso 3 para no alterar el registro original) | Se deja esta entrada como corrección explícita: la lista blanca vigente y correcta es la del código (`database.module.ts`). |

##### Pruebas de endpoint realizadas (con servidor real en `npm run start:dev`)

1. `npx tsc -p tsconfig.build.json --noEmit` → **0 errores**.
2. `npm run start:dev` → compila y arranca limpio (`Nest application successfully started`), sin dependencias circulares. Log completo en `docs/evidencias/evidencia-01-compilacion-arranque.txt`.
3. `GET /api/health` con el contenedor Postgres del entorno (`ialab-postgres`, puerto 5433) alcanzable → `200 OK`, `database.status: "connected"`. Evidencia: `docs/evidencias/evidencia-02-healthcheck-connected.txt`.
4. `GET /api/health` apuntando a un puerto inválido (motor no alcanzable, simulando el estado real de S04 sin motor desplegado) → el servidor **arranca igual** y responde `200 OK` con `database.status: "disconnected"` (no hay caída ni 500). Evidencia: `docs/evidencias/evidencia-05-healthcheck-disconnected.txt`.
5. `GET /api/docs` → `200 OK` (Swagger UI); `GET /api/docs-json` devuelve el spec OpenAPI válido. Evidencia: `docs/evidencias/evidencia-03-swagger-status.txt`.
6. Cabeceras de `helmet` presentes en las respuestas (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`). Evidencia: `docs/evidencias/evidencia-04-helmet-headers.txt`.
7. **No se pudo probar `forbidNonWhitelisted`** de forma end-to-end porque todavía no existe ningún endpoint con DTO propio (no hay capas de negocio implementadas esta semana); queda pendiente de prueba real cuando se construya el primer DTO en Semana 05+.

**Nota sobre evidencias visuales:** este entorno de ejecución no cuenta con navegador ni herramienta de captura de pantalla (WSL sin GUI, sin Playwright/Chromium instalados). Por decisión del estudiante, no se instaló Playwright (hubiera significado una dependencia nueva ~300-500MB fuera del alcance de esta sesión). Las evidencias generadas directamente por la IA quedaron en texto plano (`docs/evidencias/evidencia-*.txt`, logs y respuestas HTTP reales); el estudiante tomó además las capturas `.png` reales de Swagger UI y el Healthcheck desde su propio navegador, guardadas en `backend/docs/images/`.

##### Enlaces a Evidencias Técnicas de Terminal

* [Log de compilación y arranque limpio](./evidencias/evidencia-01-compilacion-arranque.txt) — `npm run start:dev`, sin errores, sin dependencias circulares.
* [Respuesta de Healthcheck — BD conectada](./evidencias/evidencia-02-healthcheck-connected.txt) — `GET /api/health` con el Postgres dockerizado del entorno alcanzable.
* [Estado HTTP de Swagger UI en /api/docs](./evidencias/evidencia-03-swagger-status.txt) — confirma `200 OK` en la ruta interactiva obligatoria.
* [Headers de seguridad de Helmet](./evidencias/evidencia-04-helmet-headers.txt) — CSP, HSTS, X-Content-Type-Options, X-Frame-Options presentes.
* [Respuesta de Healthcheck — BD inalcanzable](./evidencias/evidencia-05-healthcheck-disconnected.txt) — prueba de que el servidor no se cae y responde `200 OK` con `database.status: "disconnected"`.

**Capturas `.png` (Swagger UI y Healthcheck en navegador):** tomadas por el estudiante desde su propio navegador en `http://localhost:3000/api/docs` y `http://localhost:3000/api/health`, guardadas en `backend/docs/images/`:

![Swagger UI Operativo](./images/Swagger%20UI.png)
![Healthcheck en Navegador](./images/Healthcheck%20de%20Base%20de%20Datos.png)

##### Gate Learning — Complemento honesto de esta sesión

*   **Dimensión: Diagnóstico** — *¿Por qué `GET /api/health` ya no depende de que el motor de base de datos esté arriba para que el servidor arranque?*
    *   *Respuesta:* Antes, `SequelizeModule.forRootAsync` tenía `autoLoadModels: true`, lo que hace que `@nestjs/sequelize` llame `sequelize.authenticate()` **durante el arranque** (en `SequelizeCoreModule`, antes de que `NestFactory.create()` termine). Si el motor no responde, esa promesa se rechaza y el bootstrap completo falla, sin llegar nunca a levantar el servidor HTTP. Como el motor real del proyecto está deliberadamente diferido a la Semana 05, se cambió a `autoLoadModels: false` (no hay modelos de negocio registrados aún, así que no cambia nada funcionalmente) para que Sequelize solo construya la conexión sin autenticar en el arranque. El `HealthController` ahora hace su propio `authenticate()` bajo demanda, con `try/catch`, cada vez que alguien llama `GET /api/health` — así el estado de la base de datos es informativo, no bloqueante.
*   **Dimensión: Honestidad de evidencia** — *¿Se comprobó realmente lo que dice la bitácora de la Semana 04 original (`GET /api/health -> 200 OK`, entrada Paso 3 #05)?*
    *   *Respuesta:* No se pudo reproducir tal cual: al iniciar esta auditoría no existía archivo `.env` local y, con la validación estricta de `DB_DIALECT` ya implementada, el servidor no podía arrancar en absoluto sin un dialecto válido configurado. Es decir, la entrada previa de la bitácora probablemente se registró en un momento en que `.env` sí tenía valores (no versionado, por diseño), y esa evidencia no era reproducible al inicio de esta sesión. Se corrigió creando un `.env` local (ignorado por Git) y arreglando el bug de `DB_USERNAME`/`DB_USER`, y ahora sí es reproducible tal como se documenta arriba.
