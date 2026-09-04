# Documento de Diseño de Software (SDD) - CircularGuajira (v3)
## Sistema Integrado de Gestión para la Cadena de Reciclaje (Semana 04 - 2026-II)

Este documento de diseño de software (SDD) establece las bases de la arquitectura, modelo de datos, reglas de negocio e integración de servicios para **CircularGuajira**, un sistema diseñado para digitalizar la cadena de suministro de reciclaje en el departamento de La Guajira [96]. El sistema permite coordinar rutas de recolección de materiales reciclables, registrar pesajes detallados aplicando tarifas vigentes, automatizar la liquidación de cara a los recicladores, controlar el stock físico de materiales en planta y registrar la comercialización final a las industrias transformadoras [96].

---

### 1. Alineación del Objetivo y Alcance (Momento MIRIA 1)

*   **Propósito:** Modelar e implementar el backend base para **CircularGuajira** utilizando **NestJS** y el ORM **Sequelize (TypeScript)** en un entorno WSL 2, conectándose remotamente a bases de datos dockerizadas y estableciendo una arquitectura limpia por capas desacopladas que sirva de base para el crecimiento continuo del sistema [2, 63, 66].
*   **Alcance Semanal (OBJ-S04):** 
    *   Comprender y modelar el dominio de la cadena de reciclaje, identificando actores, entidades, relaciones e invariantes esenciales de negocio [66].
    *   Establecer la arquitectura por capas físicas (Presentation -> Application -> Domain <- Infrastructure) [10, 110].
    *   Definir los contratos iniciales de API (DTO) para la comunicación cliente-servidor [64].
    *   Implementar la base técnica en NestJS que incluya validaciones de variables de entorno, middleware de seguridad (Helmet), tuberías de validación global (ValidationPipe), documentación Swagger interactiva y un servicio de monitoreo de salud del sistema (/health) [14, 16].
    *   Diseñar y acotar una **rebanada vertical transaccional** que demuestre la integración atómica entre pesaje, inventario de planta y liquidación financiera bajo autenticación con JWT y control de acceso por roles (RBAC) [2].
*   **Fuera de Alcance:** Interfaz de usuario (frontend) [66], integraciones con pasarelas de pago reales para recicladores, optimización matemática de rutas mediante GPS, automatización de alertas por SMS o integraciones externas con transportadores (planificados para futuras unidades de desarrollo).

---

### 2. Modelo de Dominio de CircularGuajira (Momento MIRIA 2)

El modelo de negocio de CircularGuajira se estructura alrededor de la recolección física del material reciclable, su tasación, el balance de stock físico y la compensación financiera [96, 98]. Para cumplir con las exigencias pedagógicas del curso, se definen las entidades de negocio centrales agrupadas en módulos lógicos, combinadas con el subsistema de identidad y control de acceso (RBAC) [28, 96, 98]:

#### 2.1. Entidades de Negocio (Core)

1.  **Reciclador (Módulo collectors):** Persona u organización proveedora de materiales [96, 102].
    *   *Atributos:* `id` (UUID), `nombre` (String, obligatorio), `documento_identidad` (String, único, obligatorio), `tipo` (Enum: INDIVIDUAL, ASOCIACION), `is_active` (Boolean), `created_at` (Timestamp), `updated_at` (Timestamp) [97, 103].
2.  **Ruta (Módulo routes):** Planificación del recorrido o circuito para la recolección [96, 97].
    *   *Atributos:* `id` (UUID), `nombre` (String, obligatorio), `descripcion` (String, opcional), `sector` (String), `is_active` (Boolean), `created_at` (Timestamp), `updated_at` (Timestamp) [97].
3.  **PuntoRecoleccion (Módulo routes):** Parada física asignada a una Ruta [97, 98].
    *   *Atributos:* `id` (UUID), `ruta_id` (UUID, FK), `direccion` (String, obligatorio), `latitud` (Decimal, opcional), `longitud` (Decimal, opcional), `secuencia` (Integer, secuencia de parada), `is_active` (Boolean), `created_at` (Timestamp) [97, 103].
4.  **Recoleccion (Módulo collectors):** Evento logístico de recolección en una Ruta para un Reciclador en una fecha dada [97, 98].
    *   *Atributos:* `id` (UUID), `ruta_id` (UUID, FK), `reciclador_id` (UUID, FK), `vehiculo_placa` (String, opcional), `conductor_nombre` (String, opcional), `fecha` (Date, obligatorio), `estado` (Enum: PROGRAMADA, EN_PROCESO, COMPLETADA, CANCELADA), `is_active` (Boolean), `created_at` (Timestamp), `updated_at` (Timestamp) [97, 103].
5.  **Material (Módulo materials):** Tipo de residuo reciclable clasificado (ej. Cartón, Vidrio, PET, Aluminio) [96, 97].
    *   *Atributos:* `id` (UUID), `nombre` (String, obligatorio, único), `descripcion` (String, opcional), `categoria` (Enum: PAPEL_CARTON, PLASTICO, VIDRIO, METAL, OTROS), `unidad_medida` (String, default: 'KG'), `is_active` (Boolean), `created_at` (Timestamp), `updated_at` (Timestamp) [97].
6.  **TarifaMaterial (Módulo materials):** Precio por kilogramo asignado a un material bajo un período específico de vigencia [97, 98].
    *   *Atributos:* `id` (UUID), `material_id` (UUID, FK), `precio_por_kg` (Decimal, obligatorio, positivo), `fecha_inicio` (Date, obligatorio), `fecha_fin` (Date, obligatorio), `creado_por_user_id` (UUID, FK), `is_active` (Boolean), `created_at` (Timestamp), `updated_at` (Timestamp) [97, 103].
7.  **Pesaje (Módulo weighing):** Registro del peso bruto, tara y cálculo del peso neto de un material específico dentro de una Recolección [96, 97].
    *   *Atributos:* `id` (UUID), `recoleccion_id` (UUID, FK), `material_id` (UUID, FK), `registrado_por_user_id` (UUID, FK), `peso_bruto` (Decimal, obligatorio), `tara` (Decimal, obligatorio), `peso_neto` (Decimal, calculado, obligatorio), `tarifa_material_id` (UUID, FK, tarifa aplicada), `monto_calculado` (Decimal, calculado), `lote_material_id` (UUID, FK nullable, lote que alimenta en planta), `created_at` (Timestamp), `updated_at` (Timestamp) [97, 103].
8.  **Planta (Módulo plant):** Centro de acopio físico donde se reciben y procesan los materiales [96, 97].
    *   *Atributos:* `id` (UUID), `nombre` (String, obligatorio), `ubicacion` (String), `capacidad_maxima_ton` (Decimal, obligatorio, positivo), `is_active` (Boolean), `created_at` (Timestamp), `updated_at` (Timestamp) [97, 103].
9.  **LoteMaterial (Módulo plant):** Stock acumulado por material en una planta física, listo para compactación o comercialización [96, 97, 98].
    *   *Atributos:* `id` (UUID), `planta_id` (UUID, FK), `material_id` (UUID, FK), `cantidad_acumulada_kg` (Decimal, obligatorio, no negativo), `estado` (Enum: EN_PROCESO, COMPACTADO, DESPACHADO), `is_active` (Boolean), `created_at` (Timestamp), `updated_at` (Timestamp) [97, 103].
10. **VentaMaterial (Módulo plant):** Registro de la venta y despacho de un lote físico de material acumulado hacia industrias transformadoras [96, 97, 98].
    *   *Atributos:* `id` (UUID), `lote_material_id` (UUID, FK), `cliente_industrial_nombre` (String, obligatorio), `peso_comercializado` (Decimal, obligatorio, positivo), `precio_venta_por_kg` (Decimal, obligatorio, positivo), `precio_venta_total` (Decimal, calculado, positivo), `registrado_por_user_id` (UUID, FK), `fecha_venta` (Date), `created_at` (Timestamp), `updated_at` (Timestamp) [97, 103].
11. **Liquidacion (Módulo settlements):** Documento contable que consolida el valor a pagar a un Reciclador debido a los pesajes realizados en una Recolección [96, 98].
    *   *Atributos:* `id` (UUID), `recoleccion_id` (UUID, FK, referencia_id), `reciclador_id` (UUID, FK), `fecha_liquidacion` (Date, obligatorio), `valor_subtotal` (Decimal, obligatorio, positivo), `valor_retencion` (Decimal, obligatorio), `valor_total_pagar` (Decimal, calculado, obligatorio), `estado` (Enum: PENDIENTE, APROBADA, PAGADA, ANULADA), `observaciones` (String), `aprobado_por_user_id` (UUID, FK, opcional), `transaccion_bancaria_ref` (String, opcional), `created_at` (Timestamp), `updated_at` (Timestamp) [98, 103].

#### 2.2. Entidades de Seguridad y Acceso (Módulo auth/identity)

12. **User:** Cuenta de acceso digital para los empleados de CircularGuajira [17, 40].
    *   *Atributos:* `id` (UUID), `username` (String, único, obligatorio), `email` (String, único, obligatorio), `password_hash` (String, obligatorio), `is_active` (Boolean), `created_at` (Timestamp) [40].
13. **Role / RoleUser:** Configuración de roles de trabajo del personal y la tabla asociativa [17, 41, 99].
    *   *Roles:* `ADMIN` (acceso administrativo total), `LOGISTICA` (gestión de rutas y recolecciones), `BASCULA` (pesaje y recepción), `PLANTA` (lotes, stock e inventario en centros de acopio), `FINANZAS` (tarifas y liquidaciones bancarias) [17, 41, 102].
14. **Resource / ResourceRole:** Matriz de permisos detallada sobre endpoints HTTP para habilitar el control RBAC [17, 42].
15. **RefreshToken:** Persistencia para rotación segura de tokens y manejo de sesiones activas [17, 43].

---

### 3. Invariantes de Negocio y Reglas de Integración (Momento MIRIA 2)

Las siguientes invariantes definen los límites lógicos e inquebrantables del dominio de CircularGuajira, y deben ser implementadas en las clases puras del dominio de TypeScript sin intervención del ORM [3, 105]:

*   **`INV-01` (Cálculo del Peso Neto):** El peso neto de un `Pesaje` se calcula de forma estricta en el servidor como la diferencia entre el peso bruto y la tara del contenedor (`peso_neto = peso_bruto - tara`) [105]. El resultado debe ser estrictamente positivo (`peso_neto > 0`). Si el peso bruto es menor o igual a la tara, la transacción se aborta con un error [105].
*   **`INV-02` (Aplicación de Tarifa Histórica Vigente):** El monto total de un `Pesaje` (`monto_calculado = peso_neto * precio_por_kg`) debe calcularse utilizando la tarifa vigente asociada al material en la fecha exacta del pesaje [105]. La tarifa vigente se localiza mediante un filtro temporal donde `fecha_pesaje` se encuentre dentro del rango inclusive `fecha_inicio` y `fecha_fin` del registro `TarifaMaterial` [105]. No se permite aplicar la última tarifa creada de forma ciega si la fecha no coincide.
*   **`INV-03` (Control de Sobregiro de Inventario - Stock en Planta):** Para registrar una `VentaMaterial`, el `peso_comercializado` no puede ser superior a la `cantidad_acumulada_kg` disponible en el `LoteMaterial` correspondiente de la planta. El stock en planta nunca puede ser negativo.
*   **`INV-04` (No Solapamiento de Tarifas):** Para un mismo `material_id`, no pueden existir dos registros de `TarifaMaterial` cuyas vigencias temporales (rango `fecha_inicio` - `fecha_fin`) se solapen. Esto garantiza la predictibilidad de costos.
*   **`INV-05` (Inmutabilidad de Pesajes Liquidados):** Si la `Liquidacion` asociada a una `Recoleccion` se encuentra en estado `APROBADA` o `PAGADA`, todos sus pesajes quedan en estado bloqueado. No se permite agregar nuevos pesajes, ni modificar o eliminar los existentes para esa recolección.
*   **`INV-06` (Verificabilidad de la Liquidación):** Una `Liquidacion` debe poder rastrearse directamente hasta la `Recoleccion` de origen [105]. El valor total de la liquidación se calcula en el servidor de forma agregada sumando los montos de todos los pesajes aprobados asociados a esa recolección, deduciendo retenciones si aplica [105]. El cliente o frontend nunca envía el valor total de la liquidación a guardar.
*   **`INV-07` (RBAC Estricto):** Solo usuarios con rol `BASCULA` o `ADMIN` pueden registrar pesajes [102, 105]. Solo usuarios con rol `FINANZAS` o `ADMIN` pueden autorizar y pagar liquidaciones [102, 105]. Solo usuarios con rol `LOGISTICA` o `ADMIN` pueden iniciar o cerrar recolecciones [102].

---

### 4. Casos de Uso del Dominio (UC) y Requisitos (REQ-DOM)

| Código UC | Caso de Uso | Requisito de Dominio | Endpoint Propuesto | Rol Autorizado |
| :--- | :--- | :--- | :--- | :--- |
| **UC-01** | Registrar Recolección | `REQ-DOM-01`: Programar y asignar un reciclador a una ruta de recolección [106]. | `POST /api/recolecciones` | `LOGISTICA`, `ADMIN` [107] |
| **UC-02** | Registrar Pesaje e Inventariar | `REQ-DOM-02`: Captura física de pesos, cálculo de peso neto, aplicación de tarifa vigente, actualización de lote físico en planta y acumulación de liquidación [106]. | `POST /api/weighing` | `BASCULA`, `ADMIN` [107] |
| **UC-03** | Consultar Tarifa Vigente | `REQ-DOM-03`: Obtener el precio activo del material por fecha para cálculos previos [106]. | `GET /api/materials/:id/tarifa-vigente` | `BASCULA`, `FINANZAS`, `ADMIN` [107] |
| **UC-04** | Compactar Lote en Planta | `REQ-DOM-04`: Agrupar material y cambiar estado del lote para habilitarlo para venta [106]. | `POST /api/lotes-material` | `PLANTA`, `ADMIN` [107] |
| **UC-05** | Comercializar Lote (Venta) | `REQ-DOM-05`: Vender lotes de materiales a industrias, reduciendo stock y registrando ingreso [106]. | `POST /api/ventas-material` | `PLANTA`, `ADMIN` [107] |
| **UC-06** | Generar y Pagar Liquidación | `REQ-DOM-06`: Consolidar la liquidación de una recolección y registrar el pago final al reciclador [106]. | `POST /api/liquidaciones` | `FINANZAS`, `ADMIN` [107] |

---

### 5. Arquitectura por Capas de CircularGuajira (Momento MIRIA 2)

El proyecto adopta un enfoque estricto de **Arquitectura Hexagonal / Limpia**, dividiendo físicamente las carpetas en cuatro capas para garantizar que el dominio permanezca 100% puro y completamente desacoplado de las librerías tecnológicas (como NestJS o Sequelize) [10, 13, 28]:

```text
src/
├── main.ts                    # Bootstrap de NestJS, Helmet, ValidationPipes y Swagger [10, 16]
├── app.module.ts              # Módulo raíz que importa Config y Sequelize atómicamente [10, 14]
├── config/                    # Configuraciones validadas (BD, JWT, Swagger, etc.) [10]
├── common/                    # Decoradores, Guards globales de RBAC, interceptores y filtros [10]
├── infrastructure/            # Adaptadores tecnológicos cruzados
│   ├── database/
│   │   ├── sequelize/         # Conexión ORM y registro unificado de modelos [10, 14]
│   │   └── seeders/           # Carga inicial ordenada de roles, usuarios y recursos [10]
│   └── security/              # Criptografía bcrypt y lógica de generación de JWT [10]
└── features/                  # Módulos de negocio bien delimitados
    ├── business/              # Capacidad Core de la Cadena de Reciclaje
    │   ├── collectors/        # Módulo de Recicladores y Recolecciones [111]
    │   ├── routes/            # Módulo de Rutas y Puntos de Recolección [111]
    │   ├── materials/         # Módulo de Catálogo de Materiales y Tarifas históricas [111]
    │   ├── weighing/          # Módulo core de Pesajes (Báscula) [111]
    │   ├── plant/             # Módulo de Plantas, Lotes e Inventario físico [111]
    │   ├── settlements/       # Módulo de Liquidaciones y pagos financieros [111]
    │   └── business.module.ts # Integrador de los submódulos de negocio
    └── auth/                  # Control de Acceso, Identidad y Seguridad (RBAC) [10]
        ├── users/             # Gestión de Cuentas de Usuarios [10]
        ├── roles/             # Catálogo de Roles (BASCULA, PLANTA, etc.) [10]
        ├── role-users/        # Asociación de Roles a Usuarios [10]
        ├── resources/         # Endpoints de la API protegidos [10]
        ├── resource-roles/    # Permisos asignados a los Roles [10]
        ├── refresh-tokens/    # Manejo de sesiones concurrentes [10]
        ├── authentication/    # Endpoint de Login / Refresh Token / Logout [10]
        └── auth.module.ts     # Integrador del ecosistema de seguridad
```

#### 5.1. Estructura Interna Obligatoria de Cada Módulo
Para cumplir con la separación física de responsabilidades, cada subcarpeta de negocio en `features/` está organizada de manera idéntica en las siguientes 4 capas obligatorias [11]:

1.  **`domain/` (Capa de Dominio):** Contiene las entidades puras, enumeraciones, excepciones personalizadas de negocio, lógica de validación de invariantes e interfaces de puertos de persistencia (interfaces de repositorios) [11]. **Restricción estricta:** Está totalmente prohibido importar cosas de `@nestjs`, `sequelize`, variables de entorno o decoradores de persistencia en esta capa [13, 14].
2.  **`application/` (Capa de Aplicación):** Contiene los casos de uso (orquestadores de negocio) y los DTOs de entrada y salida [11]. Los casos de uso invocan la lógica del dominio, interactúan con los puertos de persistencia e inyectan servicios sin conocer el detalle de la base de datos [113].
3.  **`presentation/` (Capa de Presentación):** Contiene los controladores HTTP, filtros de excepciones, decoradores y especificaciones de Swagger [11]. Es la encargada de validar el formato de entrada mediante class-validator y delegar el comando a la capa de aplicación [113]. No contiene lógica de bases de datos ni reglas de negocio [113].
4.  **`infrastructure/` (Capa de Infraestructura):** Contiene la implementación real de la persistencia: los modelos de Sequelize con decoradores de TS, los repositorios que implementan los puertos de la capa de aplicación y la orquestación de transacciones atómicas de Sequelize [11, 13].

---

### 6. La Rebanada Vertical Transaccional Integrada (POST /api/weighing)

Para cumplir con la directriz pedagógica del curso de **evitar CRUDs aislados y demostrar una capacidad integrada**, la operación principal de la Semana 04 es el registro de un pesaje en báscula [1, 2]. Este servicio integra a 4 submódulos diferentes (`collectors`, `materials`, `plant`, `settlements`) bajo una **transacción atómica relacional de Sequelize**, garantizando que el inventario físico y la contabilidad financiera permanezcan 100% coordinados [2, 13]:

```text
       Cliente (Operador BASCULA)
                   │
                   ▼ (HTTP POST /api/weighing con Bearer Token JWT)
         ┌───────────────────┐
         │ Presentation Layer│ --> Valida DTO con ValidationPipe (pesoBruto > tara) [16]
         └─────────┬─────────┘
                   │ Mapea a comando
                   ▼
         ┌───────────────────┐
         │ Application Layer │ --> Orquesta el Caso de Uso "RegisterWeighingUseCase"
         └─────────┬─────────┘
                   │
                   ▼ (Inicia Sequelize Transaction - Capa de Infraestructura) [20]
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ 1. Validar Recolección: Comprobar que la recolección exista y esté activa.     │
  │ 2. Validar Reciclador: Verificar que el reciclador asociado esté is_active=true. │
  │ 3. Buscar Tarifa Activa: Consultar la TarifaMaterial vigente para el material   │
  │    según la fecha de la recolección (rango fecha_inicio/fecha_fin) (INV-02).     │
  │ 4. Crear Pesaje: Instanciar entidad Pesaje calculando el peso neto (INV-01) y   │
  │    el monto calculado aplicando la tarifa vigente localizada (pesoNeto * tarifa) │
  │ 5. Alimentar Inventario: Incrementar la "cantidad_acumulada_kg" del             │
  │    LoteMaterial correspondiente a la planta física donde se acopia.              │
  │ 6. Generar/Actualizar Liquidación: Localizar la liquidación de la recolección.   │
  │    Si no existe, se crea en estado PENDIENTE. Se acumula el subtotal, se calcula │
  │    la retención de ley de La Guajira, y se actualiza el valor total (INV-06).   │
  │                                                                                 │
  │ * CUALQUIER FALLA (Stock, Tarifas, Privacidad o Conexión) provoca ROLLBACK. *   │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

Esta rebanada vertical demuestra en una sola ejecución el correcto funcionamiento de: **Autenticación JWT, Seguridad RBAC por Guards, Reglas de Dominio puras, Gestión de Inventario físico en Planta y Cierre Financiero consistente** [2, 23].

---

### 7. Contratos de la API (EVI-S04-04)

Todos los endpoints de la API se unifican bajo el prefijo `/api` y responden estructurados de forma consistente con su código de estado HTTP [16, 23].

#### A. Endpoint de Salud (GET /api/health) [22]
*   **Descripción:** Comprueba el estado del sistema NestJS y, de forma segura (sin interrumpir la respuesta si falla), la conexión con el motor de base de datos dockerizado [14]. Mientras el motor no esté desplegado localmente (ver `.env.example`, diferido a Semana 05), `database.status` responde `not_configured` o `disconnected` en lugar de provocar un error 500.
*   **Respuesta de Éxito (200 OK):**
```json
{
  "status": "ok",
  "uptime": 12.345,
  "timestamp": "2026-09-03T18:02:06Z",
  "database": {
    "status": "connected",
    "dialect": "postgres"
  }
}
```

#### B. Inicio de Sesión Operativo (POST /api/auth/login) [22]
*   **Payload de Entrada:**
```json
{
  "username": "operador_bascula_01",
  "password": "PasswordSegura99!"
}
```
*   **Respuesta de Éxito (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Autenticación exitosa",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1LTY2NzciLCJ1c2VybmFtZSI6Im9wZXJhZG9yX2Jhc2N1bGFfMDEiLCJyb2xlcyI6WyJCQVNDVUxBIl19...",
    "refreshToken": "rf-99228833aabbccddee1122",
    "user": {
      "id": "u-6677",
      "username": "operador_bascula_01",
      "email": "bascula01@circularguajira.org",
      "roles": ["BASCULA"]
    }
  }
}
```

#### C. Crear Pesaje y Liquidar Transaccionalmente (POST /api/weighing) [22, 45]
*   **Cabecera Obligatoria:** `Authorization: Bearer <JWT_TOKEN>` [2, 20]
*   **Payload de Entrada:** (ver especificación completa y campos snake_case en `docs/contratos.md` §D)
```json
{
  "recoleccion_id": "7b88aa09-1122-4433-8899-abcdef123456",
  "material_id": "0a11bb22-3344-5566-7788-99abcdef0123",
  "peso_bruto": 450.80,
  "tara": 20.30
}
```
*   **Respuesta de Éxito (201 Created):** ver ejemplo completo con nomenclatura `snake_case` en `docs/contratos.md` §D.
*   **Respuesta de Error por Tara Superior al Peso Bruto (400 Bad Request):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "La tara no puede ser mayor o igual al peso bruto",
    "El peso neto resultante debe ser estrictamente positivo mayor a cero (INV-01)"
  ]
}
```
*   **Respuesta de Error por Usuario No Autorizado (403 Forbidden):**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Acceso denegado: Tu rol actual [PLANTA] no posee permisos para el recurso [POST /api/weighing]"
}
```

---

### 8. Matriz de Trazabilidad Metodológica MIRIA (Momento 2)

| Código OBJ | Código SPEC | Código REQ | Código AC | Código Issue | Resultado / Evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OBJ-S04** | SPEC-S04 | REQ-S04-01 | AC-S04-01 | **#01** | `docs/sdd.md` - Definición completa del dominio, actores y casos de uso [72, 73, 115]. |
| **OBJ-S04** | SPEC-S04 | REQ-S04-02 | AC-S04-02 | **#02** | Diagrama de Clases del Dominio CircularGuajira (entidades, campos e invariantes) [72, 73, 115]. |
| **OBJ-S04** | SPEC-S04 | REQ-S04-03 | AC-S04-03 | **#03** | Diagrama de Arquitectura por Capas con flujo físico de archivos de NestJS [72, 73, 115]. |
| **OBJ-S04** | SPEC-S04 | REQ-S04-04 | AC-S04-04 | **#04** | Contratos de la API (JSON requests/responses) definidos detalladamente [72, 73, 115]. |
| **OBJ-S04** | SPEC-S04 | REQ-S04-05 | AC-S04-05 | **#05** | Base del backend en NestJS operativa en WSL 2, conexión de BD, Helmet, Swagger y /health [72, 73, 115]. Evidencia real (auditoría 2026-09-03): [Log de Compilación](./evidencias/evidencia-01-compilacion-arranque.txt) · [Headers de Helmet](./evidencias/evidencia-04-helmet-headers.txt) · [Respuesta de Healthcheck](./evidencias/evidencia-02-healthcheck-connected.txt). |
| **OBJ-S04** | SPEC-S04 | REQ-S04-06 | AC-S04-06 | **#06** | Sincronización entre este SDD, el tablero Kanban y la bitácora de proceso [72, 73, 115]. |

---

### 9. Políticas de Desarrollo y Calidad (DoR y DoD)

#### Criterio de Entrada (Definition of Ready - DoR) [73]
1.  La tarjeta del Issue en el tablero Kanban debe contener una descripción explícita de su REQ y AC asociados [31].
2.  Debe existir una especificación previa del modelo de datos y de la lógica de negocio en el archivo `docs/sdd.md` [21].
3.  El desarrollador debe tener validada la IP del host y la conexión activa a la base de datos dockerizada [9].

#### Criterio de Salida (Definition of Done - DoD) [24, 73]
1.  El código debe estar estructurado estrictamente en las capas correspondientes (Presentation -> Application -> Domain -> Infrastructure) [10, 110].
2.  La capa de dominio no debe tener importaciones acopladas con el framework NestJS ni con Sequelize [13, 14].
3.  Todas las validaciones de datos de entrada se resuelven en DTOs de Presentation con class-validator [45].
4.  Toda manipulación de base de datos que afecte inventario físico, pesajes o liquidaciones debe ejecutarse dentro de un bloque Sequelize `Transaction` para garantizar atomicidad [2, 13, 45].
5.  El endpoint debe estar verificado mediante solicitudes locales (curl o Postman) y la captura legible del JSON de respuesta debe guardarse en `docs/evidencias/semana-04/` [21, 24].
6.  La bitácora de desarrollo con IA en `docs/proceso.md` debe estar actualizada con las interacciones del incremento [27].
