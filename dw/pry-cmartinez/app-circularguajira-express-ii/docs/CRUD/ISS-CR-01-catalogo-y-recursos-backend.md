# 🛠 ISS-CR-01 · Catálogo y operaciones del backend

**Fase:** construir backend  
**Depende de:** [ISS-CR-00](./ISS-CR-00-contexto-y-contrato.md)  
**Habilita:** [ISS-CR-02](./ISS-CR-02-matriz-y-reconciliacion-backend.md)

## Objetivo

Representar cada operación que el middleware puede autorizar, publicarla por
rutas protegidas y tener un catálogo inicial reproducible. El panel no puede
mostrar de forma fiable una operación que no existe en el backend.

## Arquitectura: mantén el recorrido

En una API Express organizada por features, la petición sigue este recorrido:

```text
Route → authenticate → authorize → Controller → Service → Repository → Model
```

- **Route:** método, path y middleware que se ejecuta.
- **Controller:** adapta HTTP al servicio y define códigos/envolturas.
- **Service:** valida reglas de negocio y decide qué operación ejecutar.
- **Repository:** concentra consultas Sequelize cuando el proyecto adopta esa
  capa.
- **Model:** representa la tabla y sus relaciones.
- **Catálogo:** declara los pares `method + path` que se pueden conceder.
- **Seeder:** asegura que cada entrada exista sin duplicar la misma operación.

No pongas consultas Sequelize en la ruta ni hagas que el frontend invente el
catálogo.

## 1. Inspecciona antes de implementar

En el proyecto de referencia, los archivos que debes leer son:

- Backend: `src/features/auth/resources/resource-catalog.ts`,
  `src/features/auth/resources/resources.seeder.ts`,
  `src/features/auth/resource-roles/resource-roles.routes.ts` y
  `src/features/crud/pedalibre.routes.ts`.
- Seguridad: `src/features/auth/access/authorize.middleware.ts` y el helper de
  coincidencia de rutas.
- CRUD de negocio: `src/features/crud/pedalibre.controller.ts`,
  `src/features/crud/pedalibre.service.ts` y
  `Frontd-2026/src/app/features/crud/crud-resource-page.ts`.
- Panel Roles y permisos: `Frontd-2026/src/app/features/admin/admin-page.ts`.

Confirma cómo se comparan las rutas con parámetros (`:id`), cómo se representa
un permiso en la sesión y qué respuesta devuelve cada endpoint. En otra
aplicación los nombres pueden ser distintos.

En PedalLibre, conserva esta separación: el catálogo/concesiones son parte de
`auth`, las rutas de negocio están en `features/crud` y la matriz se muestra en
el panel administrativo. No muevas los archivos de autenticación a la carpeta
CRUD ni crees una segunda implementación de las rutas.

## 2. Diseña el recurso

El recurso RBAC debe expresar una operación ejecutable, no solo el nombre de
una pantalla. Ejemplo parcial de entrada:

```ts
{
  method: "PATCH",
  path: "/api/mi-entidad/:id",
  description: "Actualizar una entidad"
}
```

El ejemplo no es un catálogo completo. Completa la lista para las operaciones
reales de tu API y usa un path canónico para IDs. El middleware, el catálogo y
las rutas deben coincidir exactamente después de la normalización definida por
el proyecto.

### Crear el archivo del catálogo (proyecto de práctica)

Desde la raíz del backend, ejecuta esto únicamente si el archivo todavía no
existe. En PedalLibre ya hay un catálogo: no lo reemplaces; agrega o corrige
entradas en su lista actual.

```bash
mkdir -p src/features/auth/resources
cat > src/features/auth/resources/resource-catalog.ts <<'EOF'
export type ResourceMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ResourceCatalogEntry {
  method: ResourceMethod;
  path: string;
  description: string;
}

export const RESOURCE_CATALOG: ResourceCatalogEntry[] = [
  { method: "GET", path: "/api/stations", description: "Listar estaciones" },
  { method: "POST", path: "/api/stations", description: "Crear estación" },
  // TODO: agrega detalle, actualización y eliminación si tu API los implementa.
  // TODO: agrega los recursos de la entidad de tu proyecto.
];
EOF
```

**Qué debes completar:** agrega los endpoints que existen realmente, comprueba
si usan `PUT`, `PATCH` o ambos, y añade acciones especiales como recursos
independientes cuando necesiten autorización independiente. No declares una
operación solo para que aparezca una casilla.

### Integración manual en las carpetas CRUD existentes de PedalLibre

No ejecutes el `cat >` anterior en esta copia. Para enlazar una nueva entidad
de negocio al CRUD y luego hacerla administrable desde RBAC:

**Modelo:** abre `src/features/crud/pedalibre.models.ts`. Agrega la clase junto
a los otros modelos y la llamada `init` en la sección de inicializaciones. En
esta copia `Model`, `DataTypes`, `sequelize` y `primaryKey` ya están definidos;
en otro proyecto agrega los imports/helper equivalentes.

```ts
export class MyEntity extends Model {
  declare id: number;
  declare name: string;
}

MyEntity.init(
  {
    id: primaryKey("my_entity_id"),
    name: { type: DataTypes.STRING(120), allowNull: false },
  },
  { sequelize, modelName: "MyEntity", tableName: "my_entities", timestamps: true, underscored: true },
);
```

Sustituye el nombre de tabla, la llave primaria y las columnas por las del
esquema SQL; no reemplaces todo `pedalibre.models.ts`.

**Relaciones:** si el modelo usa una llave foránea, agrega ambos lados en
`src/features/crud/pedalibre.associations.ts`, junto a las otras asociaciones:

```ts
MyEntity.belongsTo(ParentEntity, { foreignKey: "parent_id", as: "parent" });
ParentEntity.hasMany(MyEntity, { foreignKey: "parent_id", as: "my_entities" });
```

Los `as` deben coincidir con los nombres usados luego en `include` del service.
Si no hay relación, no agregues una ficticia.

1. En `src/features/crud/pedalibre.service.ts`, agrega el nombre al tipo
   `PedalibreEntity` junto a las otras cadenas de entidad:

   ```ts
   | "payments"
   | "mi_entidad";
   ```

   Luego agrega dentro de `entityDefinitions` la definición correspondiente.
   Sustituye `MyEntity` y los campos por los de tu modelo; no pegues el bloque
   como si fuera el archivo completo:

   ```ts
   mi_entidad: {
     model: MyEntity,
     fields: ["name", "description"],
     required: ["name"],
     writable: true,
   },
   ```

   El modelo también debe importarse desde `pedalibre.models.ts`. Sin el tipo,
   el modelo y la definición de campos, el controlador no puede operar la
   entidad.
2. En `src/features/crud/pedalibre.routes.ts`, agrega una entrada dentro del
   arreglo `crudRoutes` (no reemplaces el arreglo ni el `for` que crea rutas):

   ```ts
   {
     entity: "mi_entidad",
     path: "/api/mi-entidad",
     canCreate: true,
     canUpdate: true,
     canDelete: false,
   },
   ```

   `entity` debe pertenecer a `PedalibreEntity`. El bucle existente registra
   `GET` y, según los flags, `POST`, `PATCH` y `DELETE`, todos con los
   middlewares de autenticación y autorización.

   Para las operaciones CRUD estándar no agregues handlers nuevos a
   `pedalibre.controller.ts`: `list`, `getOne`, `create`, `update` y `delete`
   ya reciben la entidad como argumento y llaman al service. Si agregas una
   acción especial del negocio, crea su método en controller y service y
   registra una ruta explícita.
3. En `src/features/auth/resources/resource-catalog.ts`, agrega antes del
   cierre de `RESOURCE_CATALOG` los pares `method + path` que realmente
   registraste. Por ejemplo:

   ```ts
   { method: "GET", path: "/api/mi-entidad", description: "Listar mi entidad" },
   { method: "POST", path: "/api/mi-entidad", description: "Crear mi entidad" },
   { method: "GET", path: "/api/mi-entidad/:id", description: "Consultar mi entidad" },
   { method: "PATCH", path: "/api/mi-entidad/:id", description: "Actualizar mi entidad" },
   ```

   No incluyas `DELETE` si `canDelete` es `false`; las rutas y el catálogo
   deben coincidir. El seeder de recursos leerá el catálogo.
4. En `Frontd-2026/src/app/features/crud/crud-resources.ts`, agrega dentro de
   `businessResources` una entrada con su `endpoint` y campos de formulario.
   No reemplaces el objeto completo:

   ```ts
   "mi-entidad": {
     title: "Mi entidad",
     description: "Administra los registros de mi entidad.",
     endpoint: "mi-entidad",
     fields: [
       { key: "name", label: "Nombre", type: "text", required: true },
     ],
   },
   ```

   Después, dentro de `businessRoutes` en
   `Frontd-2026/src/app/app.routes.ts`, agrega la tupla que carga el
   `CrudResourcePage`:

   ```ts
   ["mi-entidad", "GET /api/mi-entidad"],
   ```

   Y en `Frontd-2026/src/app/layout/aside/nav.config.ts`, agrega el enlace
   dentro de `navigationItems`:

   ```ts
   { path: "/mi-entidad", label: "Mi entidad", icon: "pi-box", permission: "GET /api/mi-entidad" },
   ```

El componente de página y el cliente HTTP ya son genéricos. En
`Frontd-2026/src/app/features/crud/crud-resource-page.ts`, agrega en el
constructor la lectura de la ruta y la configuración, antes de usar `config`:

```ts
const key = this.route.snapshot.data["resource"] as string;
const config = businessResources[key];
if (!config) throw new Error(`Unknown business resource "${key}"`);
this.config = config;
this.fields = config.fields;
```

En el mismo archivo, `load()` usa el endpoint del recurso y el `BusinessApi`
genérico; agrega o conserva este llamado dentro de la carga:

```ts
this.api.list(this.config.endpoint, this.config.listEnvelope).subscribe({
  next: (rows) => {
    this.rows.set(rows);
    this.loading.set(false);
  },
  error: (error: unknown) => {
    this.error.set(toApiMessage(error));
    this.loading.set(false);
  },
});
```

En `crud-resource-page.html`, conserva el formulario y la tabla genéricos que
iteran `fields` y `rows`; la configuración de `crud-resources.ts` determina
qué controles se renderizan. Por eso la clave de `app.routes.ts`, la entrada
de `crud-resources.ts` y el endpoint REST deben coincidir. No dupliques
`CrudResourcePage` ni `BusinessApi` por entidad.

La matriz de permisos **no** se conecta a `crud-resources.ts`: carga el
catálogo desde `GET /api/recursos`. Esta separación permite que una ruta
registrada en backend aparezca automáticamente como una operación que el rol
administrador puede conceder.

### Conectar el router, modelos y Swagger

PedalLibre ya realiza estos registros; cuando estés armando una feature CRUD
nueva en otra copia, agrega los enlaces en estos puntos.

En `src/config/index.ts`, importa los modelos y las asociaciones junto a las
demás features:

```ts
import "../features/crud/pedalibre.models";
import "../features/crud/pedalibre.associations";
```

En `src/routes/index.ts`, importa la clase y crea su instancia dentro de
`Routes`:

```ts
import { PedalibreRoutes } from "../features/crud/pedalibre.routes";

public pedalibreRoutes: PedalibreRoutes = new PedalibreRoutes();
```

En el registro de rutas de `App` dentro de `src/config/index.ts`, llama:

```ts
this.routePrv.pedalibreRoutes.routes(this.app);
```

En `src/swagger/index.ts`, importa `pedalibreSwagger` y agrégalo al arreglo
`featureSwaggerModules`. En `pedalibre.swagger.ts`, agrega el prefijo de la
entidad al filtro de rutas para que también aparezca en Swagger. Comprueba
primero si cada enlace ya existe; no dupliques imports ni registros.

Esta separación permite que el archivo de rutas declare handlers, mientras
que el arranque de Express los registra una sola vez y Swagger los documenta.

### Ubica las rutas y pruebas

En PedalLibre, el catálogo anterior ya está implementado. Las rutas de negocio
y su lógica se organizan en `src/features/crud/pedalibre.routes.ts`,
`pedalibre.controller.ts` y `pedalibre.service.ts`; las rutas de autorización
de concesiones están en
`src/features/auth/resource-roles/resource-roles.routes.ts`. El catálogo no
crea esas rutas automáticamente: debes comprobar ambos lados.

Para un proyecto nuevo, anota primero los archivos existentes:

```bash
find src/features/crud src/features/auth/resources src/features/auth/resource-roles -maxdepth 2 -type f
rg -n "authenticate|authorize|app\\.route|RESOURCE_CATALOG" src/features
```

Con el resultado, decide qué feature existente extender. No crees una segunda
ruta CRUD o un segundo catálogo que represente los mismos endpoints.

### Decisiones que debes registrar

- ¿`PUT` y `PATCH` son operaciones distintas para RBAC o una misma columna?
- ¿Las acciones especiales tienen permisos propios? Ejemplos:
  `POST /api/rentals/start` y `PATCH /api/bicycle-dockings/:id/undock`.
- ¿Una entidad admite eliminación física, baja lógica o ninguna?
- ¿Hay rutas de lectura que deben limitar resultados por propietario?

Una casilla “Crear” puede agrupar varios `POST` bajo una entidad. En PedalLibre,
por ejemplo, el recurso para anclar una bicicleta también es un `POST`. Explica
esa consecuencia al usuario administrador; no confundas la etiqueta de la
casilla con la semántica exacta de cada ruta.

### Nota sobre el estado de referencia

En esta copia se habilitaron rutas CRUD genéricas para todas las entidades de
negocio para que la matriz tenga recursos C/R/U/D. Eso **no demuestra** que
cualquier escritura directa sea válida para el dominio. Por ejemplo, crear un
alquiler como una fila genérica podría omitir la comprobación de pago y los
cambios transaccionales que realiza el flujo de inicio; insertar un movimiento
de anclaje directamente podría no actualizar el estado del punto. Antes de
usar el patrón en producción, reemplaza esas escrituras genéricas por métodos
del servicio que mantengan las invariantes o no publiques la operación como un
CRUD directo. La matriz administra acceso, no corrige reglas incompletas.

## 3. Define las capacidades reales

No declares cuatro métodos en el catálogo si las rutas o el servicio no los
pueden manejar. Tampoco habilites un método solo para quitar una raya de la
pantalla. Para cada entidad, registra una tabla de capacidad:

| Método | ¿Ruta disponible? | ¿Regla del servicio? | ¿Permiso sembrado? |
|---|---:|---:|---:|
| GET | por verificar | por verificar | por verificar |
| POST | por verificar | por verificar | por verificar |
| PUT/PATCH | por verificar | por verificar | por verificar |
| DELETE | por verificar | por verificar | por verificar |

Si la operación no es segura o no tiene sentido en el dominio, documenta por
qué y no la expongas como habilitable. Un permiso concedido a una ruta
inexistente no aporta una capacidad válida.

## 4. Protege las rutas

Cada endpoint sensible debe aplicar autenticación y autorización antes de
ejecutar su controlador:

```ts
app.route(path)
  .get(authenticate, authorize, controller.list)
  .post(authenticate, authorize, controller.create);
```

Es un esquema ilustrativo, no código listo para pegar: enlaza handlers con el
contexto correcto y utiliza el patrón de rutas existente en tu proyecto.

El servicio sigue validando datos incluso para una petición autorizada. RBAC
responde “¿puede invocar esta operación?”; la validación del servicio responde
“¿es legal esta operación con estos datos y este estado?”.

## 5. Siembra sin duplicados

El seeder del catálogo debe ser idempotente: ejecutar el proceso otra vez no
crea dos filas para un mismo par `method + path`. Verifica también que una
entrada inactiva se reactive si esa es la política acordada.

En PedalLibre, `db:seed` no solo actualiza el catálogo: también reconcilia los
permisos de los roles con reglas predeterminadas. **Puede cambiar permisos que
un administrador ajustó manualmente.** En una base que conserva configuración
personalizada, no ejecutes ese seeder completo sin revisar el efecto. Diseña
una orden de sincronización de catálogo separada o realiza el cambio en una
base de pruebas y confirma la política de reconciliación antes de usarla.

## 6. Verifica

1. Compila TypeScript.
2. Inspecciona que no existan pares `method + path` duplicados.
3. Comprueba en la base de pruebas que el seeder se pueda repetir.
4. Llama a un endpoint sin token y confirma `401`.
5. Llama con token válido pero sin concesión y confirma `403`.
6. Concede temporalmente el permiso en una base descartable y confirma el
   resultado esperado.
7. Verifica que un dato inválido se rechace aunque el permiso esté concedido.

## Criterios de aceptación

- [ ] Cada operación que se desea administrar tiene ruta y recurso coherentes.
- [ ] Las rutas sensibles usan autenticación y autorización.
- [ ] El servicio conserva sus reglas de negocio.
- [ ] El catálogo evita duplicados y tiene descripciones entendibles.
- [ ] Los efectos del seeder sobre concesiones personalizadas están descritos.
- [ ] No se probó la eliminación sobre registros reales o protegidos.

## Cierre

Antes de construir el guardado masivo, el middleware debe reconocer exactamente
los recursos que se conceden. Continúa con
[ISS-CR-02](./ISS-CR-02-matriz-y-reconciliacion-backend.md).
