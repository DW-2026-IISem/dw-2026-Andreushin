# 🛠 ISS-CR-03 · Cliente HTTP y panel de matriz

**Fase:** construir frontend  
**Depende de:** [ISS-CR-02](./ISS-CR-02-matriz-y-reconciliacion-backend.md) y
  sesión JWT operativa  
**Habilita:** [ISS-CR-04](./ISS-CR-04-integracion-y-cierre.md)

## Objetivo

Construir la pantalla administrativa que selecciona un rol, consulta su
catálogo, muestra permisos CRUD por entidad y guarda los cambios mediante el
endpoint de reconciliación.

La pantalla nunca calcula permisos efectivos para proteger una API: presenta
una herramienta de administración. La autorización sigue en Express.

En PedalLibre, el CRUD de negocio está en
`Frontd-2026/src/app/features/crud/` y el panel **Roles y permisos** ya forma
parte de `Frontd-2026/src/app/features/admin/admin-page.ts` y
`admin-page.html`. No crees una segunda pantalla dentro de `features/crud` ni
una carpeta `role-permissions` en esta copia: integra los cambios en el panel
existente. La carpeta `crud` es para las pantallas de las entidades del
negocio, no para administrar concesiones.

## Recorrido del frontend

```text
AdminPage (estado y eventos)
  → AdminApi (URLs, parámetros y envolturas HTTP)
  → HttpClient
  → interceptor (token)
  → API
```

Al mantener este límite, cambiar el endpoint o la forma de respuesta no obliga a
mezclar serialización HTTP con la plantilla.

## Integrar manualmente en el frontend existente de PedalLibre

En esta copia no crees `permission-matrix-api.service.ts` ni una pantalla nueva:
ya existen `AdminApi` y `AdminPage`. Usa estos pasos para insertar o comparar
los bloques.

### 1. Contratos compartidos

Abre `Frontd-2026/src/app/core/models/admin.model.ts`. En PedalLibre ya están
`AdminRole`, `AdminResource`, `RoleGrant` y `RoleGrantReconciliation`. Si
adaptas el código a otro proyecto, agrega ahí los tipos que falten; por
ejemplo, al final del archivo:

```ts
export interface RoleGrantReconciliation {
  role_id: number;
  activated: number;
  deactivated: number;
  total_active: number;
}
```

No dupliques una interfaz si ya existe con ese contrato.

### 2. Cliente HTTP

Abre `Frontd-2026/src/app/core/services/admin-api.ts`. Dentro de `AdminApi`,
junto a `listRoleGrants`, agrega el método de guardado si todavía no lo tienes:

```ts
reconcileRole(role_id: number, resource_ids: number[]): Observable<RoleGrantReconciliation> {
  return this.http
    .post<Record<string, unknown>>(`${this.base}/concesiones-rol`, { role_id, resource_ids })
    .pipe(map((response) => requiredReconciliation(response)));
}
```

Conserva el helper que valida la envoltura `result`; no reemplaces todo
`AdminApi`. `listRoleGrants` debe llamar a
`GET /concesiones-rol?role_id=...` y validar la envoltura `grants`. Así la
plantilla no arma URLs ni procesa respuestas HTTP.

### 3. Estado y comportamiento del panel

Abre `Frontd-2026/src/app/features/admin/admin-page.ts`. El panel se representa
en la sección `grants`, no en `features/crud`. Si faltan, agrega junto a los
signals administrativos:

```ts
readonly permissionRoles = signal<AdminRole[]>([]);
readonly permissionResources = signal<AdminResource[]>([]);
readonly selectedRoleId = signal("");
readonly selectedResourceIds = signal<Set<number>>(new Set());
readonly permissionRows = computed(() => buildPermissionMatrix(this.permissionResources()));
```

Agrega `buildPermissionMatrix` y sus tipos (`CrudOperation` y
`PermissionMatrixRow`) fuera de la clase, junto a los tipos auxiliares. Dentro
de `AdminPage`, inserta `loadPermissionMatrix` y `loadRoleGrants` junto a los
métodos privados de carga. Esas funciones consultan roles y recursos, y luego
las concesiones del rol elegido. Al guardar, el método de la clase debe enviar
el conjunto completo seleccionado:

```ts
this.api.reconcileRole(roleId, [...this.selectedResourceIds()]).subscribe({
  next: (result) => {
    this.saving.set(false);
    this.permissionSaveMessage.set(
      `Cambios guardados. ${result.total_active} permisos activos para este rol.`,
    );
    this.loadRoleGrants(roleId);
  },
  error: (error: unknown) => {
    this.saving.set(false);
    this.formError.set(toApiMessage(error));
  },
});
```

Inserta el llamado dentro de `savePermissionMatrix()` y conserva el control de
`saving`, autorización y errores que usa el resto de la página. No lo pegues
dentro del método genérico `save()`: ese método crea o actualiza usuarios,
roles y recursos.

### 4. Plantilla, ruta y navegación

En `admin-page.html`, localiza el bloque superior
`@if (section === 'grants')`. Si muestra concesiones como filas de un CRUD,
reemplaza **solo el contenido de esa rama** por la matriz; conserva el `@else`
que presenta las demás secciones. Cada celda disponible usa los recursos
agrupados por operación:

```html
@for (operation of crudColumns; track operation.key) {
  <td>
    @if (row.operations[operation.key].length) {
      <input type="checkbox"
        [checked]="isOperationGranted(row, operation.key)"
        [indeterminate]="isOperationPartiallyGranted(row, operation.key)"
        (change)="toggleOperation(row, operation.key, $event)" />
    } @else {
      <span>No disponible</span>
    }
  </td>
}
```

La opción administrativa ya debe apuntar a `AdminPage`. Si falta en
`Frontd-2026/src/app/app.routes.ts`, agrega la tupla en `adminRoutes`:

```ts
["admin/grants", "GET /api/concesiones-rol", "grants"],
```

Si falta en `Frontd-2026/src/app/layout/aside/nav.config.ts`, agrega el enlace
en `navigationItems`:

```ts
{ path: "/admin/grants", label: "Concesiones", icon: "pi-key", permission: "GET /api/concesiones-rol" },
```

En PedalLibre estos bloques ya están conectados. Úsalos como referencia y
modifica solo el punto que necesites; no reemplaces los archivos completos.

## 1. Define modelos que reflejen el contrato

Representa por separado rol, recurso, concesión y resultado de reconciliación.
El modelo de recurso necesita como mínimo `id`, `method` y `path`; el de
concesión necesita `role_id`, `resource_id` y estado activo/inactivo.

Fragmento orientativo:

```ts
interface Resource {
  id: number;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
}
```

No uses `any` para que una respuesta mal formada parezca válida. Valida la
envoltura que entrega el servidor (`roles`, `resources`, `grants`, `result`) y
propaga un error legible si falta.

### Crear un modelo inicial

Desde la raíz Angular, ejecuta el bloque solo si aún no tienes modelos
administrativos. PedalLibre ya declara estos contratos en
`src/app/core/models/admin.model.ts`; allí se amplían los tipos existentes en
lugar de crear duplicados. Las pantallas CRUD de negocio permanecen en
`src/app/features/crud/`; los modelos compartidos siguen en `core/models`.

```bash
mkdir -p src/app/core/models
cat > src/app/core/models/permission-matrix.model.ts <<'EOF'
export interface PermissionRole {
  id: number;
  name: string;
  description: string | null;
}

export interface PermissionResource {
  id: number;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string | null;
}

export interface PermissionGrant {
  id: number;
  role_id: number;
  resource_id: number;
  is_allowed: boolean;
}

export interface PermissionMatrixPayload {
  role_id: number;
  resource_ids: number[];
}
EOF
```

**Qué debes completar:** añade opcionales solo si el API los devuelve y define
por separado el tipo de la respuesta de reconciliación. No marques una
propiedad obligatoria si el backend puede devolver `null`.

## 2. Encapsula HTTP en un servicio

El cliente HTTP debe ofrecer operaciones pequeñas y tipadas:

- listar roles;
- listar recursos;
- listar concesiones filtrando por `role_id`;
- reconciliar recursos de un rol.

Para filtros usa `HttpParams`; para la matriz envía los IDs seleccionados. No
construyas query strings concatenando valores sin codificación y no persistas
el token en este servicio: corresponde al interceptor/session store existente.

Comprueba en Network que el interceptor añade el token y que el cliente usa la
URL configurada por el environment, no una URL local fija.

### Crear un esqueleto del cliente HTTP

En una copia limpia, crea el servicio siguiente. Si ya existe un `AdminApi`
como el de PedalLibre, extiende ese servicio y adapta sus métodos en vez de
crear un segundo cliente.

```bash
mkdir -p src/app/core/services
cat > src/app/core/services/permission-matrix-api.service.ts <<'EOF'
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  PermissionGrant,
  PermissionMatrixPayload,
  PermissionResource,
  PermissionRole,
} from "../models/permission-matrix.model";

@Injectable({ providedIn: "root" })
export class PermissionMatrixApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listRoles(): Observable<PermissionRole[]> {
    // TODO: lee la envoltura real de GET /roles.
    return this.http.get<{ roles: PermissionRole[] }>(`${this.base}/roles`)
      .pipe(map((response) => response.roles));
  }

  listResources(): Observable<PermissionResource[]> {
    // TODO: verifica el nombre de la envoltura de tu API.
    return this.http.get<{ resources: PermissionResource[] }>(`${this.base}/recursos`)
      .pipe(map((response) => response.resources));
  }

  listGrants(roleId: number): Observable<PermissionGrant[]> {
    // TODO: confirma el query param y la envoltura de la lista.
    const params = new HttpParams().set("role_id", roleId);
    return this.http.get<{ grants: PermissionGrant[] }>(
      `${this.base}/concesiones-rol`, { params },
    ).pipe(map((response) => response.grants));
  }

  saveMatrix(payload: PermissionMatrixPayload): Observable<unknown> {
    // TODO: tipa el resultado real y maneja la envoltura que devuelve el API.
    return this.http.post(`${this.base}/concesiones-rol`, payload);
  }
}
EOF
```

Revisa los imports relativos si tu estructura difiere. El interceptor debe
seguir siendo quien añade JWT. Completa tipos de respuesta y errores siguiendo
el patrón de tu aplicación.

## 3. Modela el estado de la pantalla

En el componente de referencia, Angular Signals representan:

- `permissionRoles`: roles disponibles;
- `permissionResources`: catálogo activo;
- `selectedRoleId`: rol elegido;
- `selectedResourceIds`: IDs actualmente marcados;
- `loading`, `saving`, `error` y mensaje de guardado.

Usa valores derivados (`computed`) para filas, etiquetas y estados parciales.
Así la plantilla renderiza estado, pero no reimplementa reglas de agrupación.

### Secuencia de carga

1. Solicita roles y recursos. En PedalLibre se pueden cargar en paralelo.
2. Elige un rol válido (o no selecciones ninguno si la lista está vacía).
3. Consulta concesiones para ese rol.
4. Inicializa el conjunto de IDs marcados.
5. Si el usuario cambia de rol, descarta el mensaje anterior y carga las
   concesiones del rol nuevo.

Evita mostrar casillas con permisos viejos mientras llega la respuesta nueva.
Considera deshabilitar selección/guardado durante la carga.

### Crear la carpeta de la pantalla

En una copia limpia que aún no tenga panel administrativo, crea la pantalla y
una plantilla mínima. Completa los `TODO` siguiendo las secciones de carga,
agrupación, estados de casillas y guardado que siguen. En PedalLibre, integra
esa lógica en `src/app/features/admin/admin-page.ts` y `admin-page.html`
existentes. El `CrudResourcePage` ubicado en `src/app/features/crud/` administra
entidades de negocio y no se reemplaza para construir la matriz de roles.

```bash
mkdir -p src/app/features/admin/role-permissions
cat > src/app/features/admin/role-permissions/role-permissions-page.ts <<'EOF'
import { CommonModule } from "@angular/common";
import { Component, OnInit, inject, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { PermissionMatrixApi } from "../../../core/services/permission-matrix-api.service";
import {
  PermissionResource,
  PermissionRole,
} from "../../../core/models/permission-matrix.model";

@Component({
  selector: "app-role-permissions-page",
  standalone: true,
  imports: [CommonModule, ButtonModule, MessageModule],
  templateUrl: "./role-permissions-page.html",
})
export class RolePermissionsPage implements OnInit {
  private readonly api = inject(PermissionMatrixApi);
  readonly roles = signal<PermissionRole[]>([]);
  readonly resources = signal<PermissionResource[]>([]);
  readonly selectedRoleId = signal("");
  readonly selectedResourceIds = signal<Set<number>>(new Set());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInitialData();
  }

  selectRole(event: Event): void {
    this.selectedRoleId.set((event.target as HTMLSelectElement).value);
    this.selectedResourceIds.set(new Set());
    // TODO: consulta las concesiones del rol elegido y actualiza la selección.
  }

  toggleResource(resourceId: number, event: Event): void {
    const next = new Set(this.selectedResourceIds());
    if ((event.target as HTMLInputElement).checked) next.add(resourceId);
    else next.delete(resourceId);
    this.selectedResourceIds.set(next);
  }

  saveMatrix(): void {
    // TODO: valida rol, llama al API, muestra éxito/error y recarga concesiones.
  }

  private loadInitialData(): void {
    // TODO: carga roles y recursos; maneja carga, respuesta vacía y error.
  }
}
EOF
cat > src/app/features/admin/role-permissions/role-permissions-page.html <<'EOF'
<section class="space-y-5">
  <header>
    <h1 class="text-2xl font-bold">Roles y permisos</h1>
    <p>Selecciona un rol para consultar y configurar sus permisos.</p>
  </header>

  <label class="flex flex-col gap-1">
    Rol
    <select [value]="selectedRoleId()" (change)="selectRole($event)">
      <option value="">Selecciona un rol</option>
      @for (role of roles(); track role.id) {
        <option [value]="role.id">{{ role.name }}</option>
      }
    </select>
  </label>

  @if (error()) { <p-message severity="error">{{ error() }}</p-message> }

  <!-- TODO: agrupa resources() por entidad y método para renderizar la matriz C/R/U/D. -->
  <ul>
    @for (resource of resources(); track resource.id) {
      <li>
        <label>
          <input type="checkbox"
            [checked]="selectedResourceIds().has(resource.id)"
            (change)="toggleResource(resource.id, $event)" />
          {{ resource.method }} {{ resource.path }}
        </label>
      </li>
    }
  </ul>

  <button pButton type="button" [disabled]="loading() || saving() || !selectedRoleId()"
    (click)="saveMatrix()">
    {{ saving() ? "Guardando…" : "Guardar permisos" }}
  </button>
</section>
EOF
```

La implementación de PedalLibre usa `src/app/features/admin/admin-page.ts` y
`admin-page.html` porque comparten secciones administrativas. Si tu proyecto
prefiere una pantalla dedicada, crea
`role-permissions-page.ts` y `role-permissions-page.html` en esa carpeta y
registra su ruta protegida. No mantengas dos paneles que administren la misma
matriz.

El HTML inicial muestra una lista plana a propósito: sustituye ese bloque por
la tabla agrupada descrita arriba. El `Set<number>` del componente conserva la
selección concreta que se enviará al backend; no guardes solo el estado visual
de una fila.

## 4. Agrupa el catálogo para la matriz

La transformación es:

```text
recurso → segmento de entidad del path → etiqueta de fila
         → operación según method → colección de resource IDs
```

Ejemplo de agrupación conceptual:

```text
GET /api/stations         → stations / Leer
POST /api/stations        → stations / Crear
PATCH /api/stations/:id   → stations / Actualizar
DELETE /api/stations/:id  → stations / Eliminar
```

No copies a ciegas una expresión como `path.split('/')[2]`: primero decide
cómo tu API nombra entidades, rutas anidadas y acciones. En una ruta
`/api/rentals/start`, el segmento de entidad sigue siendo `rentals`, pero el
`POST` representa “iniciar” además de crear. Decide y comunica si se agrupan o
se presentan por separado.

La interfaz de referencia agrupa `PUT` y `PATCH` en Actualizar. Una fila muestra
“No disponible” cuando no tiene ningún recurso de esa operación; no lo
representa con una casilla deshabilitada que sugiera que existe una operación.
Si el requisito del proyecto exige habilitar las cuatro, primero crea y prueba
los endpoints y sus reglas en el backend.

## 5. Calcula los estados de casilla

Una columna puede agrupar varios recursos. Debe mostrar:

- marcada: todos los IDs del grupo están seleccionados;
- desmarcada: ninguno está seleccionado;
- parcial: algunos, pero no todos, están seleccionados.

Al activar la casilla, añade todos los IDs del grupo al conjunto; al desactivarla,
retíralos todos. No guardes solo un booleano por celda: la API necesita los
`resource_ids` concretos.

Los botones “Marcar todo” y “Desmarcar todo” operan sobre recursos disponibles
del catálogo. Revisa con cuidado su significado de negocio y la posible
concesión de permisos sensibles.

## 6. Guarda de forma atómica

Al pulsar Guardar:

1. valida que haya un rol seleccionado;
2. previene doble envío;
3. limpia el error anterior;
4. envía `role_id` y el arreglo completo de `resource_ids`;
5. muestra el error recibido si falla;
6. si funciona, presenta el resultado y vuelve a consultar las concesiones.

No confirmes “guardado” solo porque el usuario cambió una casilla. El éxito se
anuncia después de la respuesta exitosa del servidor.

## 7. Accesibilidad y seguridad visual

- Nombra cada casilla con operación + entidad, por ejemplo
  `Crear Estaciones`.
- Conserva encabezados semánticos y etiquetas para el selector de rol.
- Comunica carga, error y éxito con regiones entendibles por lectores de
  pantalla.
- Oculta controles administrativos si el usuario no tiene el permiso
  correspondiente, pero recuerda: es UX, no seguridad.
- Evita exponer el formulario a roles que no pueden guardar la matriz.

## Criterios de aceptación

- [ ] Cambiar rol carga la matriz correcta.
- [ ] Todos, ninguno y selección parcial se muestran correctamente.
- [ ] Una casilla modifica todos los recursos que agrupa.
- [ ] Guardar envía `role_id` y `resource_ids`, no un mapa visual ambiguo.
- [ ] Fallos de red/API se presentan; no simulan éxito.
- [ ] Un rol sin permisos produce una matriz desmarcada, no un error.
- [ ] La pantalla funciona sin acoplarse a Sequelize o a tablas de BD.
- [ ] Los controles tienen nombres accesibles.

## Cierre

La pantalla ya representa y modifica permisos mediante el contrato del backend.
Continúa con [ISS-CR-04](./ISS-CR-04-integracion-y-cierre.md).
