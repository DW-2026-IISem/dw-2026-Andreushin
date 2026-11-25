# 🛠 ISS-CR-00 · Contexto y contrato del panel RBAC

**Fase:** comprender y diseñar  
**Depende de:** autenticación, roles, recursos y middleware de autorización  
**Habilita:** ISS-CR-01 — Catálogo y operaciones backend

> La meta de este ISS no es escribir el panel. Primero debes poder explicar qué
> permiso representa una casilla y qué componente es responsable de aplicarlo.

## Contexto mínimo (autosuficiente)

El panel de referencia pertenece a PedalLibre. Su backend es Express +
TypeScript + Sequelize y su frontend es Angular standalone. La autorización se
resuelve en el backend con RBAC; la interfaz solo consulta y edita concesiones.

En esta copia, el CRUD de negocio está organizado en `src/features/crud/` y
`Frontd-2026/src/app/features/crud/`. No confundas esas carpetas con el panel
Roles y permisos: los recursos y concesiones RBAC pertenecen a
`src/features/auth/`, y la interfaz de administración de permisos forma parte
de `Frontd-2026/src/app/features/admin/admin-page.ts`. El panel concede acceso
a las rutas CRUD; no reemplaza ni duplica esas rutas o pantallas.

## Estructura CRUD de referencia y cómo se conecta

Estas son las carpetas y los archivos que muestra tu proyecto. En PedalLibre
ya existen; no los vuelvas a crear. En otra copia, crea la estructura desde
cada raíz. `touch` no borra el contenido de un archivo existente, pero ejecuta
estos comandos solamente en la copia nueva para no alterar sus fechas:

```bash
# Terminal backend: raíz que contiene el package.json de Express.
mkdir -p src/features/crud
touch src/features/crud/pedalibre.associations.ts \
  src/features/crud/pedalibre.controller.ts \
  src/features/crud/pedalibre.models.ts \
  src/features/crud/pedalibre.routes.ts \
  src/features/crud/pedalibre.service.ts \
  src/features/crud/pedalibre.swagger.ts

# Terminal frontend: primero entra a la raíz Angular.
cd Frontd-2026
mkdir -p src/app/features/crud
touch src/app/features/crud/crud-resource-page.ts \
  src/app/features/crud/crud-resource-page.html \
  src/app/features/crud/crud-resource-page.spec.ts \
  src/app/features/crud/crud-resources.ts
```

`touch` solo prepara los nombres. Los ISS posteriores muestran qué código
agregar dentro de cada archivo y en qué punto; no basta con crear archivos
vacíos.

### Backend: responsabilidades y enlaces

| Archivo | Qué se agrega | Cómo se conecta |
|---|---|---|
| `src/features/crud/pedalibre.models.ts` | Modelos Sequelize y definición de columnas | `src/config/index.ts` importa el archivo para registrar los modelos |
| `src/features/crud/pedalibre.associations.ts` | Relaciones `belongsTo`, `hasMany` y alias | `src/config/index.ts` y los seeders importan las asociaciones antes de consultar |
| `src/features/crud/pedalibre.service.ts` | Mapa de entidad a modelo, campos permitidos, validación y operaciones | El controller llama a estos métodos; no se consulta Sequelize desde la ruta |
| `src/features/crud/pedalibre.controller.ts` | Adaptación de Request/Response y envolturas `{ items }` / `{ item }` | Los handlers reciben la ruta y llaman al service |
| `src/features/crud/pedalibre.routes.ts` | Paths HTTP, controller y middlewares | `src/routes/index.ts` instancia `PedalibreRoutes`; `src/config/index.ts` registra sus rutas |
| `src/features/crud/pedalibre.swagger.ts` | OpenAPI derivado del catálogo | `src/swagger/index.ts` agrega `pedalibreSwagger` al documento |

El recorrido queda así:

```text
App/config → routes/index → PedalibreRoutes
  → authenticate → authorize → PedalibreController
  → PedalibreService → modelo Sequelize → base de datos
```

Para extender una entidad existente, sigue el ejemplo de
`ISS-CR-01`: agrega el modelo/definición al service, la entrada de ruta y el
recurso RBAC. No crees un segundo router ni un controller separado para la
misma colección.

### Frontend: responsabilidades y enlaces

| Archivo | Qué se agrega | Cómo se conecta |
|---|---|---|
| `Frontd-2026/src/app/features/crud/crud-resources.ts` | Configuración de título, endpoint y campos de cada formulario | El `CrudResourcePage` busca aquí el recurso indicado por la ruta |
| `Frontd-2026/src/app/features/crud/crud-resource-page.ts` | Carga, validación, estado y acciones de formulario/tabla | Lee `data.resource`, usa `BusinessApi` y selecciona `businessResources[key]` |
| `Frontd-2026/src/app/features/crud/crud-resource-page.html` | Plantilla que enlaza señales y eventos del componente | Renderiza el estado de `CrudResourcePage`; no llama HTTP directamente |
| `Frontd-2026/src/app/features/crud/crud-resource-page.spec.ts` | Pruebas de formulario, petición y errores | Usa `HttpTestingController` para verificar el contrato HTTP |
| `Frontd-2026/src/app/core/services/business-api.ts` | Métodos `list/create/update/remove` y validación de envolturas | Envía peticiones a `environment.apiUrl`; el interceptor agrega el JWT |
| `Frontd-2026/src/app/app.routes.ts` | Ruta con `permission` y `resource` | Carga `CrudResourcePage` y restringe el acceso con `permissionGuard` |
| `Frontd-2026/src/app/layout/aside/nav.config.ts` | Opción de navegación con el permiso requerido | El menú filtra la opción según permisos de sesión |

Una ruta de negocio se conecta con el CRUD genérico mediante este patrón de
`app.routes.ts`:

```ts
["mi-entidad", "GET /api/mi-entidad"],
```

La lista se transforma en una ruta que carga `CrudResourcePage` y pasa
`data: { permission, resource: path }`. `crud-resources.ts` debe tener la clave
`"mi-entidad"` y el endpoint `mi-entidad`; así la pantalla puede encontrar su
configuración. El permiso de navegación debe coincidir con `GET /api/mi-entidad`.
Los pasos y fragmentos para insertar estas piezas están en ISS-CR-01.

### Conexión del panel Roles y permisos

El panel no modifica `crud-resources.ts`; administra los recursos que el
backend publica para proteger las rutas:

```text
RESOURCE_CATALOG → seeder de recursos → GET /api/recursos
  → AdminApi.listResources() → AdminPage → matriz C/R/U/D
  → AdminApi.reconcileRole() → POST /api/concesiones-rol
  → ResourceRolesRoutes → controller → service/transacción → concesiones
```

La matriz muestra los recursos disponibles para asignar. Luego
`authorize` contrasta cada request de negocio con las concesiones guardadas.
Los ISS-CR-02 y ISS-CR-03 detallan los puntos de inserción de ese recorrido.

La matriz contiene operaciones HTTP del catálogo, pero no convierte por sí sola
una acción de negocio en un CRUD genérico seguro. Iniciar un alquiler, anclar
una bicicleta o liquidar un pago puede tener reglas transaccionales que no se
deben saltar mediante una escritura directa al modelo.

En este dominio:

```text
Usuario activo → rol activo → concesión activa → recurso activo
```

El usuario referencia al rol con `role_id`. Cada recurso es una operación HTTP
identificada por `method + path`, por ejemplo:

```text
GET    /api/stations
POST   /api/stations
PATCH  /api/stations/:id
DELETE /api/stations/:id
```

Una concesión asocia `role_id` con `resource_id`. El nombre del rol no concede
acceso automáticamente: la decisión sale de las concesiones activas y del
recurso activo.

## Objetivos de aprendizaje

- Diferenciar autenticación de autorización.
- Explicar qué modela un recurso y qué modela una concesión.
- Dibujar el viaje de una casilla desde el navegador hasta el middleware.
- Definir contratos antes de crear componentes o endpoints.
- Reconocer por qué una matriz CRUD no siempre equivale a CRUD genérico.
- Explicar y dibujar cómo se conectan las carpetas `crud` de backend y frontend.

## Contrato de referencia PedalLibre

| Acción | Método y ruta | Forma de respuesta |
|---|---|---|
| Listar roles | `GET /api/roles` | `{ "roles": [...] }` |
| Listar recursos | `GET /api/recursos` | `{ "resources": [...] }` |
| Consultar concesiones de un rol | `GET /api/concesiones-rol?role_id=<id>` | `{ "grants": [...] }` |
| Guardar matriz completa | `POST /api/concesiones-rol` | `{ "message": "...", "result": {...} }` |
| Consultar permisos efectivos | `GET /api/permisos` | `{ "permissions": [...] }` |

La petición de matriz lleva el conjunto completo deseado:

```json
{
  "role_id": 2,
  "resource_ids": [11, 12, 13]
}
```

El endpoint valida los identificadores y reconcilia el conjunto. Si el usuario
quita una casilla, el permiso correspondiente debe quedar revocado. No envíes
IDs de recursos que la pantalla no recibió.

La matriz de PedalLibre agrupa recursos de rutas por entidad y método:

| Columna | Métodos agrupados |
|---|---|
| Crear (C) | `POST` |
| Leer (R) | `GET` |
| Actualizar (U) | `PUT` y `PATCH` |
| Eliminar (D) | `DELETE` |

Cada casilla puede representar más de un endpoint de la entidad. Por ejemplo,
Leer puede agrupar el listado y el detalle. Antes de aplicar esta agrupación a
otro proyecto, comprueba que sus rutas están nombradas y organizadas de forma
consistente.

## Preguntas de diseño

Antes de avanzar, responde en tus palabras:

1. ¿Por qué ocultar un botón en Angular no protege un endpoint?
2. ¿Qué ocurre si un recurso está activo pero su concesión está revocada?
3. ¿Por qué la ruta `PATCH /api/bicycle-dockings/:id/undock` sigue siendo un
   recurso diferente de `PATCH /api/bicycle-dockings/:id`?
4. ¿Qué debe ocurrir si una concesión ya existe y el administrador vuelve a
   marcarla?
5. ¿Qué respuesta necesita el frontend para mostrar un error de validación?

## Criterios de aceptación

- [ ] Se puede dibujar el flujo frontend → API → persistencia sin saltarse
  capas.
- [ ] Se diferencia `role_id` del `resource_id`.
- [ ] Se entiende que el servidor autoriza cada petición.
- [ ] Se acuerda el contrato de consulta y guardado antes de implementar.
- [ ] Se define qué significa “Actualizar” cuando hay `PUT` y `PATCH`.
- [ ] Se documenta si los endpoints especiales se agrupan con el CRUD general.
- [ ] Se identifica qué archivos crear en `src/features/crud/` y
  `src/app/features/crud/` si aún no existen.
- [ ] Se puede seguir una entidad desde el modelo backend hasta la opción de
  menú frontend y el recurso que administra el panel RBAC.

## Preparación

Desde la raíz del proyecto que se usará como laboratorio:

```bash
git status --short
pwd

# Confirma dónde están los dos proyectos antes de crear archivos de código.
test -f package.json && echo "Raíz backend encontrada"
test -f Frontd-2026/package.json && echo "Raíz frontend encontrada"

# Confirma las carpetas CRUD existentes antes de tocar archivos.
find src/features/crud -maxdepth 1 -type f
find Frontd-2026/src/app/features/crud -maxdepth 1 -type f
```

Identifica el backend, el frontend, sus scripts de desarrollo y las rutas de
autenticación. No copies la ruta de otra máquina: usa la ubicación real de tu
proyecto.

En PedalLibre, las carpetas CRUD ya están creadas. No vuelvas a generarlas:
abre los archivos existentes y aplica los fragmentos de los ISS en los puntos
indicados. Los comandos de creación que siguen son solo para otra copia que
todavía no tenga estas carpetas:

```bash
# Terminal backend, en la raíz que contiene el package.json de Express.
mkdir -p src/features/auth/resources
mkdir -p src/features/auth/resource-roles/dto

# Terminal frontend, en la raíz Angular.
mkdir -p src/app/core/models
mkdir -p src/app/core/services
```

`mkdir -p` crea también los directorios padre y no falla si ya existen. No
significa que debas duplicar una feature que tu aplicación ya tenga: en ese
caso continúa sobre sus archivos existentes. En PedalLibre, esas carpetas
`crud` ya existen; el panel de permisos se integra en la pantalla administrativa
existente, no creando `src/app/features/admin/role-permissions`.

## Cierre

Este ISS entrega una decisión de diseño: el panel edita concesiones
`rol-recurso`; no asigna el rol a una persona ni reemplaza el middleware.
Continúa con [ISS-CR-01](./ISS-CR-01-catalogo-y-recursos-backend.md).
