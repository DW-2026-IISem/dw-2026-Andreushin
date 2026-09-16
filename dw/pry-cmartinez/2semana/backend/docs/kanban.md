# Tablero Kanban de Desarrollo - CircularGuajira
## Backend de la Cadena de Reciclaje (Semana 04 - 2026-II)

Este tablero Kanban sigue los lineamientos de la **Metodología MIRIA** (Momento 3: Organización Kanban) para estructurar el desarrollo del backend de **CircularGuajira**. Garantiza la trazabilidad desde el objetivo pedagógico de la semana hasta el código fuente y sus pruebas en vivo [55, 65, 74].

---

### 1. Políticas Generales del Tablero

*   **WIP (Work In Progress) = 1:** Cada estudiante solo puede tener **una sola Issue** en la columna "En desarrollo" simultáneamente [1, 78]. No se permite iniciar una nueva tarea hasta cerrar o bloquear la actual [78].
*   **Gestión de Bloqueos:** La columna "Bloqueado" no existe físicamente en el tablero [1, 78]. Los bloqueos se marcan visualmente con una etiqueta (tag) de **[BLOQUEADO]** directamente sobre la tarjeta en desarrollo, indicando en su descripción el motivo y la acción requerida para solucionarlo [1, 78].
*   **Definición de Listo (DoR - Definition of Ready) General:** Una Issue puede pasar a "En desarrollo" únicamente si sus requisitos están descritos en el SDD, sus entidades e invariantes de dominio están definidas, y sus dependencias técnicas están resueltas [6, 23, 78].
*   **Definición de Terminado (DoD - Definition of Done) General:** Una Issue se considera finalizada y lista para "Aceptada/Evidenciada" solo si cumple con la separación de capas (Domain, Application, Presentation, Infrastructure), su dominio está desacoplado de frameworks (NestJS/Sequelize), se registran los commits en la bitácora `docs/proceso.md`, y se adjunta la prueba en vivo [13, 23, 73].

---

### 2. Definición de Columnas del Tablero

1.  **Por especificar:** Tarjetas en lista de espera asociadas a resultados de aprendizaje pero que aún no cuentan con un diseño técnico en la SDD [78].
2.  **Especificada:** Tarjetas con objetivos, requisitos (REQ), criterios de aceptación (AC) y contratos definidos. Cuentan con DoR aprobado y están listas para ser tomadas [78].
3.  **En desarrollo:** La tarjeta activa en la que el programador trabaja actualmente (máximo 1 tarjeta por persona) [78].
4.  **En revisión humana:** Tarjeta completada que ha sido enviada para revisión por el docente o el equipo de QA. Requiere auditoría contra la SDD y los AC [78, 82].
5.  **En ajustes:** Tarjetas con hallazgos o bugs reportados durante la revisión. Retornan al backlog de desarrollo con acciones de corrección explícitas [78].
6.  **Aceptada/Evidenciada:** Tarjetas que cumplen al 100% con su DoD y tienen su evidencia de funcionamiento registrada formalmente en el repositorio [78, 82].

---

### 3. Matriz de Trazabilidad e Inventario de Issues

A continuación se detallan las **17 Issues** necesarias para abarcar tanto la planificación teórica como el desarrollo real por capas de la rebanada vertical de **CircularGuajira** [12, 113]:

#### Fase 1: Planificación, Diseño y Base Técnica (Cerradas/Listas para revisión)

| ID | Título del Issue | REQ Relacionado | DoR (Criterio de Entrada) | DoD (Criterio de Salida) | Columna Inicial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#01** | Documentación del Dominio y Negocio [1] | REQ-S04-01 [71] | Guía oficial CircularGuajira y narrativa inicial del catálogo 2026-II [56, 98]. | Sección M2 de `docs/sdd.md` completada con el problema, actores y reglas [1]. | **Aceptada/Evidenciada** [1] |
| **#02** | Diagramación del Modelo de Dominio [1] | REQ-S04-02 [71] | Requisitos y actores especificados en #01 [1]. | Diagrama de clases/relaciones en Mermaid incrustado en `docs/sdd.md` [1]. | **Aceptada/Evidenciada** [1] |
| **#03** | Arquitectura por Capas del Backend [1] | REQ-S04-03 [71] | Modelo de dominio definido en #02 [1]. | Estructura de capas físicas documentada con diagrama de flujo y responsabilidades [1]. | **Aceptada/Evidenciada** [1] |
| **#04** | Contratos de la API (DTO / JSON) [1] | REQ-S04-04 [71] | Entidades y relaciones documentadas en #02 [1]. | Contratos de endpoints definidos con payloads request/response en `docs/sdd.md` [1]. | **Aceptada/Evidenciada** [1] |
| **#05** | Configuración de la Base Técnica NestJS [1] | REQ-S04-05 [71] | Entorno WSL + Node LTS listo; package.json configurado [1, 7]. | Servidor NestJS inicial arranca en modo desarrollo expuesto en el puerto config [1, 16].<br>**Evidencias (auditoría 2026-09-03):** [Log de compilación limpia](./evidencias/evidencia-01-compilacion-arranque.txt)<br>[Logs de verificación de Helmet](./evidencias/evidencia-04-helmet-headers.txt)<br>[Logs de Healthcheck funcional](./evidencias/evidencia-02-healthcheck-connected.txt) | **Aceptada/Evidenciada** [1] |
| **#06** | Sincronización y Trazabilidad de Docs [1] | REQ-S04-06 [71] | Completitud de los entregables #01 a #05 [1]. | Matriz de trazabilidad y de calidad cruzada en `docs/sdd.md` y `docs/kanban.md` [1]. | **Aceptada/Evidenciada** [1] |

#### Fase 2: Desarrollo e Implementación de Capas de Negocio (Backlog)

| ID | Título del Issue | REQ Relacionado | DoR (Criterio de Entrada) | DoD (Criterio de Salida) | Columna Inicial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#07** | Implementación del Módulo `collectors` | REQ-DOM-01 [108] | `sdd-v3.md` aprobado y base NestJS operativa (#05) [102, 106]. | Capas Domain, Application (casos de uso, puertos), Presentation (DTO, controllers) e Infrastructure (modelos Sequelize de Reciclador y Recoleccion) completas [13, 114]. | **Especificada** [79] |
| **#08** | Implementación del Módulo `routes` | REQ-DOM-01 [108] | Módulo `collectors` finalizado (#07) [113]. | Entidades `Ruta` y `PuntoRecoleccion` construidas en 4 capas. Sequelize registra FK correspondiente [105, 113]. | **Por especificar** [79] |
| **#09** | Implementación del Módulo `materials` | REQ-DOM-02 [108] | Estructura base del backend NestJS operativa (#05) [113]. | Entidades `Material` y `TarifaMaterial` completadas. El dominio encapsula la lógica para recuperar tarifas vigentes por rango de fechas [105, 107]. | **Especificada** [79] |
| **#10** | Implementación del Módulo `plant` | REQ-DOM-04 [108] | Estructura base de datos y modelos Sequelize en WSL activos (#05) [113]. | Entidades `Planta` y `LoteMaterial` construidas. El dominio contiene la lógica de incremento de stock y prevención de saldo negativo en inventario [105]. | **Especificada** [79] |
| **#11** | Implementación del Módulo `settlements` | REQ-DOM-06 [108] | Módulo de tarifas de materiales completo (#09) [113]. | Entidad `Liquidacion` construida. Dominio expone el cálculo: `valor_total = peso_neto * precio_por_kg` [100, 105, 113]. | **Especificada** [79] |
| **#12** | Implementación del Módulo `weighing` (Básico) | REQ-DOM-02 [108] | Módulo de recolecciones (#07) y materiales (#09) terminados [113, 114]. | Entidad `Pesaje` construida por capas. El controlador expone `POST /api/weighing` validando DTO (peso bruto, tara) sin implementar transacciones multi-módulo [114]. | **Especificada** [79] |

#### Fase 3: Identidad, Seguridad y Control de Acceso (RBAC) (Backlog)

| ID | Título del Issue | REQ Relacionado | DoR (Criterio de Entrada) | DoD (Criterio de Salida) | Columna Inicial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#13** | Registro y Hashing de Usuarios (`User`) | REQ-DOM-04 [106] | Estructura base del backend operativa (#05) [42]. | Modelo `User` mapeado en Sequelize. Contraseñas protegidas mediante hash criptográfico unilateral (bcrypt) [42]. | **Especificada** [79] |
| **#14** | Control de Sesión y Rotación de JWTs | REQ-DOM-04 [106] | Módulo de usuarios completado (#13) [45]. | Emisión de Access Token JWT y persistencia segura de Refresh Tokens con revocación activa en base de datos [45]. | **Especificada** [79] |
| **#15** | Guard de Autorización Dinámica RBAC | REQ-DOM-04 [106] | Módulos #13 y #14 completados; base de datos seed con recursos y roles [43, 44, 48]. | Guard global operativo en NestJS que valide el token y consulte permisos dinámicos en base de datos (Usuario -> Rol -> Recurso). Distingue 401 de 403 [48]. | **Especificada** [79] |

#### Fase 4: Integración Transaccional y Cierre de Gate (Backlog)

| ID | Título del Issue | REQ Relacionado | DoR (Criterio de Entrada) | DoD (Criterio de Salida) | Columna Inicial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#16** | Rebanada Vertical Transaccional Integrada | REQ-DOM-02 [108] | Módulos `weighing`, `plant`, `settlements` y `RBAC` operativos (#07–#15) [41, 47]. | Flujo `POST /api/weighing` encapsulado bajo transacción de Sequelize. Automatiza la asignación de tarifa vigente, inserción de pesaje, adición de stock y liquidación de reciclador [41, 47]. | **Especificada** [79] |
| **#17** | Pruebas Integradas y Validación de Gate-S04 | REQ-S04-06 [71] | Rebanada vertical completada (#16) [25, 26]. | Ejecución del ciclo de pruebas de extremo a extremo, registro de bitácora en `proceso.md`, evidencias en `docs/evidencias/` y cierre del Gate [26, 52]. | **Por especificar** [79] |

---

### 4. Fichas Técnicas de Desarrollo por Issue (Backlog)

A continuación se detallan las especificaciones individuales para cada una de las tareas del Backlog de desarrollo para garantizar que el programador y la Inteligencia Artificial de apoyo trabajen sobre alcances acotados [6, 23, 29]:

---

#### ISSUE #07: Implementación del Módulo `collectors`
*   **Descripción:** Construir por capas el soporte para registrar y consultar recicladores y sus eventos físicos de recolección de residuos [97, 108].
*   **Criterio de Entrada (DoR):** Diseño de la base de datos dockerizada activa, módulos de configuración NestJS estables, e IP de conexión a la base de datos remota verificada [10].
*   **Criterio de Salida (DoD):**
    *   Directorio creado en `src/features/business/collectors/` estructurado en las capas `domain/`, `application/`, `presentation/` e `infrastructure/` [13].
    *   Entidades puras de dominio (`Reciclador`, `Recoleccion`) sin acoplamiento a NestJS o Sequelize [15, 16].
    *   Caso de uso `CreateRecicladorUseCase` expuesto en `POST /api/collectors` y validado mediante class-validator (nombre obligatorio, documento de identidad único) [37].
    *   Modelo Sequelize de persistencia en Sequelize mapeando claves primarias y campos de auditoría (`created_at`, `updated_at`) [37].
*   **Prueba Prevista:** Registrar un nuevo reciclador enviando un payload válido (201 Created). Intentar duplicar su número de documento de identidad (400 Bad Request). Consultar por ID [37].
*   **Evidencia:** Archivo de logs del servidor NestJS, captura del registro en la base de datos (vía DBeaver o DBeaver remota) y registro del commit en `docs/proceso.md` [23].

---

#### ISSUE #08: Implementación del Módulo `routes`
*   **Descripción:** Crear el módulo de negocio para planificar las rutas de los transportes de recolección y la delimitación de sus puntos geográficos o paradas autorizadas [97, 108].
*   **Criterio de Entrada (DoR):** Módulo de colectores (#07) aceptado e integrado en la base de código.
*   **Criterio de Salida (DoD):**
    *   Estructura física de carpetas en `src/features/business/routes/` en 4 capas limpias [13].
    *   Entidades de dominio `Ruta` y `PuntoRecoleccion` con validaciones de negocio básicas en TypeScript [13].
    *   Relación relacional configurada en Sequelize (`Ruta 1:N PuntoRecoleccion` y `Ruta 1:N Recoleccion`) mediante decoradores de `sequelize-typescript` [100, 105, 106].
    *   Caso de uso `CreateRutaUseCase` expuesto en `POST /api/routes` [108].
*   **Prueba Prevista:** Crear una Ruta y asignarle tres puntos de recolección en paralelo enviando sus coordenadas/direcciones, comprobando que se registre la clave foránea `ruta_id` en la tabla de puntos [105].
*   **Evidencia:** Fragmento de código del modelo Sequelize, respuesta HTTP de éxito, e inserción del commit de la tarea [23].

---

#### ISSUE #09: Implementación del Módulo `materials`
*   **Descripción:** Desarrollar el catálogo de materiales reciclables aceptados por la planta y administrar las tarifas financieras de compra por kilogramo indexadas por rango de vigencia temporal [97, 108].
*   **Criterio de Entrada (DoR):** Especificación de invariante de negocio para control temporal de tarifas aprobado en la SDD [107].
*   **Criterio de Salida (DoD):**
    *   Estructura física de carpetas en `src/features/business/materials/` [13].
    *   Entidad `TarifaMaterial` con validación en dominio que prohíba precios menores o iguales a cero (`precio_por_kg > 0`) [17, 23].
    *   Lógica en el repositorio de persistencia que realice consultas SQL optimizadas filtrando por la fecha actual entre los rangos `fecha_inicio` y `fecha_fin` para obtener la tarifa vigente [105].
    *   Restricción única de clave en Sequelize para evitar solapamiento de fechas del mismo tipo de material (invariante de consistencia de tarifas) [107].
*   **Prueba Prevista:** Crear un material ("Cartón") y asignarle una tarifa de $1,200/kg vigente durante el mes actual. Consultar la tarifa activa y validar que responda el precio correcto. Intentar crear una tarifa superpuesta para el mismo período (400 Bad Request).
*   **Evidencia:** Captura del endpoint de consulta de tarifa activa, respuesta de error por solapamiento y registro en la bitácora [23].

---

#### ISSUE #10: Implementación del Módulo `plant`
*   **Descripción:** Implementar la lógica para registrar plantas físicas de acopio, consolidar inventarios agregados de materiales en lotes y controlar las salidas comerciales externas [97, 108].
*   **Criterio de Entrada (DoR):** Modelo de materiales (#09) completado y cargado en el orquestador de Sequelize.
*   **Criterio de Salida (DoD):**
    *   Estructura en `src/features/business/plant/` en 4 capas físicas [13].
    *   Invariante de dominio en `LoteMaterial` que impida registrar existencias de stock negativas (`cantidad_acumulada_kg >= 0`).
    *   Caso de uso `CreateVentaMaterialUseCase` que reste existencias físicas del inventario y registre la comercialización en la tabla `VentaMaterial` [105].
*   **Prueba Prevista:** Crear una planta física y un lote de "PET" vacío (0 kg). Ejecutar una simulación de venta de 100 kg sobre dicho lote, comprobando que la capa de dominio arroje una excepción de negocio por inventario insuficiente y que el controlador de NestJS responda un `400 Bad Request`.
*   **Evidencia:** Logs de la excepción de dominio lanzada y la transacción rechazada en el repositorio de código [23].

---

#### ISSUE #11: Implementación del Módulo `settlements`
*   **Descripción:** Construir la estructura financiera del backend para registrar e imprimir cuentas de cobro y liquidaciones monetarias a favor de los recicladores de la cadena [98, 108].
*   **Criterio de Entrada (DoR):** Entidades de recicladores (#07) y tarifas de materiales (#09) integradas en el proyecto.
*   **Criterio de Salida (DoD):**
    *   Estructura en `src/features/business/settlements/` en 4 capas desacopladas [13].
    *   Entidad de dominio `Liquidacion` con estado limitado por el enumerado `estado` (`EMITIDA` / `PAGADA`) [100].
    *   Caso de uso en aplicación que reciba un pesaje neto, consulte la tarifa vigente en la fecha del pesaje, multiplique ambos valores y asigne de forma lógica el `valor_total` resultante.
*   **Prueba Prevista:** Crear una liquidación financiera simulada pasando como datos de entrada un peso neto de 150 kg y una tarifa de $1,500/kg, verificando que el servidor asigne el valor total exacto de $225,000 en el JSON de respuesta.
*   **Evidencia:** Captura del payload JSON devuelto por el servidor, logs del caso de uso de liquidación y registro de commit [23].

---

#### ISSUE #12: Implementación del Módulo `weighing` (Básico)
*   **Descripción:** Crear el endpoint de recepción física de materiales pesados en la báscula y calcular el volumen neto de residuo descontando el peso de los contenedores [97, 98, 108].
*   **Criterio de Entrada (DoR):** Módulos de recolección (#07) y catálogo de materiales (#09) estables y listos.
*   **Criterio de Salida (DoD):**
    *   Estructura en `src/features/business/weighing/` [114].
    *   Entidad de dominio `Pesaje` que implemente la regla del negocio: `peso_neto = peso_bruto - tara`, validando que el peso neto sea estrictamente mayor a cero [105, 107].
    *   DTO de entrada mapeado en NestJS con class-validator (`peso_bruto` y `tara` obligatorios, numéricos positivos) expuesto en `POST /api/weighing` [105].
*   **Prueba Prevista:** Enviar una solicitud de pesaje con un peso bruto de 50 kg y una tara de 60 kg, comprobando que class-validator o el caso de uso rechacen la solicitud con un código de error de datos inválidos (`400 Bad Request`) [105].
*   **Evidencia:** Captura de pantalla de la respuesta HTTP del servidor rechazando el pesaje incoherente, código del DTO y bitácora del proceso [23].

---

#### ISSUE #13: Registro y Hashing de Usuarios (`User`)
*   **Descripción:** Configurar el almacenamiento de usuarios de la plataforma y aplicar medidas criptográficas seguras para proteger las credenciales operativas del personal [42].
*   **Criterio de Entrada (DoR):** Base técnica NestJS (#05) y módulo de base de datos dockerizado en WSL listos [5, 42].
*   **Criterio de Salida (DoD):**
    *   Modelo `User` mapeado en Sequelize con un índice de unicidad para el campo `username` o `email` [42].
    *   Integración de un gancho (hook) de persistencia `@BeforeCreate` y `@BeforeUpdate` en el modelo Sequelize para transformar la contraseña en texto plano en un hash irreversible con **bcrypt** (costo de cómputo mínimo = 10 saltos) [8, 42].
    *   Exclusión estricta del campo hash de la contraseña de cualquier respuesta o payload serializado en el controlador HTTP [42].
*   **Prueba Prevista:** Crear un usuario de la báscula con la contraseña `PlantaBascula123!`. Comprobar mediante la consola o DBeaver que la contraseña almacenada en la base de datos comience con el patrón de hash `$2b$` y que no sea legible en formato de texto.
*   **Evidencia:** Captura de la tabla de usuarios en base de datos mostrando la contraseña hasheada y archivo JSON de retorno del controlador sin el campo de contraseña [23].

---

#### ISSUE #14: Control de Sesión y Rotación de JWTs
*   **Descripción:** Desarrollar los mecanismos de autenticación del sistema emitiendo tokens de corta duración y administrando tokens de refresco de sesión seguros contra robos de credenciales [45].
*   **Criterio de Entrada (DoR):** Módulo de usuarios (#13) finalizado y variables JWT configuradas en el archivo local `.env` [10, 45].
*   **Criterio de Salida (DoD):**
    *   Configuración del servicio JwtModule de NestJS importando el secreto criptográfico desde la configuración centralizada [16].
    *   Caso de uso `LoginUseCase` expuesto en `POST /api/auth/login` que valide credenciales y emita un Access Token de 15 minutos junto con un Refresh Token de 7 días [10, 24, 45].
    *   Entidad de persistencia `RefreshToken` en Sequelize vinculada al usuario, que guarde de forma hasheada el token de refresco, registre su caducidad y controle su estado de revocación activo [45].
*   **Prueba Prevista:** Iniciar sesión con un usuario válido para recibir los tokens. Consumir el endpoint de refresco con el refresh token provisto para recibir un par de tokens nuevos. Volver a usar el mismo token ya rotado y comprobar que el sistema lo rechace inmediatamente por motivos de seguridad.
*   **Evidencia:** Logs detallados del flujo de intercambio de tokens y JSON con las claves de acceso generadas con éxito [23].

---

#### ISSUE #15: Guard de Autorización Dinámica RBAC
*   **Descripción:** Implementar el control de acceso basado en roles operativos (BASCULA, PLANTA, FINANZAS, ADMIN) consultando dinámicamente los recursos registrados en la base de datos [48].
*   **Criterio de Entrada (DoR):** Módulo de autenticación (#14) activo y base de datos sembrada con los roles de referencia de CircularGuajira [48].
*   **Criterio de Salida (DoD):**
    *   Estructuras relacionales `Role`, `RoleUser`, `Resource` y `ResourceRole` mapeadas e insertadas en Sequelize [43, 44].
    *   Clase `RolesGuard` creada de manera global en `src/common/guards/` [12].
    *   El Guard debe leer la cabecera `Authorization: Bearer <JWT>`, extraer los roles del usuario, obtener el path y método HTTP consultado, y verificar en base de datos la existencia de una relación activa con el recurso para autorizar el paso.
*   **Prueba Prevista:** Iniciar sesión con un usuario con rol de `BASCULA`. Intentar consumir el endpoint `POST /api/collectors` (recurso restringido solo a `ADMIN` o `LOGISTICA`) y verificar que el servidor deniegue la transacción con un código HTTP `403 Forbidden` [104, 109].
*   **Evidencia:** Captura de la consola o DBeaver mostrando los permisos asignados en la base de datos y respuesta de error por denegación del recurso [23].

---

#### ISSUE #16: Rebanada Vertical Transaccional Integrada
*   **Descripción:** Conectar de forma transaccional el registro de la báscula con la asignación de tarifas de materiales, el aumento automático del stock físico en planta y la emisión de liquidación contable del reciclador [41, 47].
*   **Criterio de Entrada (DoR):** Todos los submódulos de negocio (#07–#12) y el Guard RBAC (#15) probados y aprobados de forma independiente.
*   **Criterio de Salida (DoD):**
    *   Modificación del caso de uso `RegisterWeighingUseCase` para inyectar una transacción de Sequelize (`Sequelize.transaction()`) [41, 47].
    *   El caso de uso coordina atómicamente:
        1.  Verificar que la recolección exista y que el reciclador asociado se encuentre activo en el sistema [98].
        2.  Buscar la tarifa por vigencia activa para el material registrado en el pesaje [98].
        3.  Crear el registro de pesaje en base de datos calculando peso neto y monto financiero [105, 107].
        4.  Actualizar la cantidad acumulada (`cantidad_acumulada_kg`) del lote de la planta sumando el peso neto [98, 100].
        5.  Generar e insertar la liquidación monetaria a favor del reciclador marcada en estado `EMITIDA` [98, 100].
*   **Prueba Prevista:** Iniciar una transacción de pesaje en el endpoint protegido `POST /api/weighing` simulando un fallo inesperado en el último paso (por ejemplo, enviando una clave de lote de planta inválida). Verificar mediante la base de datos que no se guarde ningún registro de pesaje ni liquidación huérfana (Rollback exitoso) [41, 47].
*   **Evidencia:** Algoritmo documentado del flujo de negocio, código del bloque transaccional del servicio de aplicación, logs de la base de datos demostrando la ejecución de `ROLLBACK` ante fallos controlados, y captura de respuesta HTTP de éxito [23, 41, 47].

---

#### ISSUE #17: Pruebas Integradas y Validación de Gate-S04
*   **Descripción:** Ejecutar las pruebas completas de extremo a extremo exigidas por el curso, consolidar las evidencias físicas en el repositorio y realizar la retrospectiva de aprendizaje del Gate-S04 [26, 52].
*   **Criterio de Entrada (DoR):** Rebanada vertical transaccional e integrada (#16) completamente desarrollada y sin fallos conocidos.
*   **Criterio de Salida (DoD):**
    *   Ejecución manual secuencial de la prueba completa de verificación: Crear usuario -> Iniciar sesión y obtener JWT -> Crear material y tarifa -> Crear reciclador y recolección -> Registrar pesaje integrado transaccional en `POST /api/weighing` -> Verificar actualización de stock y liquidación generada -> Simular stock negativo/tara inválida y verificar rollback -> Simular accesos no autorizados (401 y 403) [25].
    *   Registro de la bitácora de auditoría humana de prompts en `docs/proceso.md` [29, 49].
    *   Creación de subcarpetas en `docs/evidencias/semana-04/` conteniendo capturas legibles y estructuradas [86].
    *   Completitud de la autoevaluación y checklist de calidad del Gate-S04 [52, 90].
*   **Prueba Prevista:** Ejecutar el guion de pruebas e2e y verificar que el 100% de los casos de uso definidos en la SDD completen con éxito y con la protección RBAC activa.
*   **Evidencia:** Archivo de bitácora completo, capturas de pantalla de la ejecución y checklist firmado en el repositorio.
