# 🛠 ISS-CR-02 · Guardado de la matriz en el backend

**Fase:** construir backend  
**Depende de:** [ISS-CR-01](./ISS-CR-01-catalogo-y-recursos-backend.md)  
**Habilita:** [ISS-CR-03](./ISS-CR-03-api-y-panel-frontend.md)

## Objetivo

Recibir en una sola petición el conjunto deseado de recursos para un rol,
validarlo y aplicarlo como una unidad de trabajo. Este endpoint es el puente
entre las casillas de la interfaz y las concesiones persistidas.

## Contrato antes que implementación

En PedalLibre:

```http
POST /api/concesiones-rol
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "role_id": 2,
  "resource_ids": [11, 12, 13]
}
```

Respuesta de éxito resumida:

```json
{
  "message": "Role permissions updated",
  "result": {
    "role_id": 2,
    "activated": 1,
    "deactivated": 2,
    "total_active": 3
  }
}
```

La respuesta permite informar cuántos permisos cambiaron. No expongas modelos
Sequelize directamente si el proyecto utiliza DTOs.

### Crear el contrato DTO

Desde la raíz del backend, crea este archivo solo si tu arquitectura aún no
tiene un DTO para la reconciliación. En PedalLibre, el archivo
`src/features/auth/resource-roles/dto/create-resource-role.dto.ts` ya contiene
los dos contratos; amplíalo ahí según las convenciones del proyecto, no lo
dupliques.

```bash
mkdir -p src/features/auth/resource-roles/dto
cat > src/features/auth/resource-roles/dto/reconcile-resource-roles.dto.ts <<'EOF'
export interface ReconcileResourceRolesDto {
  role_id: number;
  resource_ids: number[];
}

export interface ReconcileResult {
  role_id: number;
  activated: number;
  deactivated: number;
  total_active: number;
}
EOF
```

Este archivo solo define la forma de los datos. **Todavía debes** validar el
JSON en el controller y aplicar las reglas en el service; un tipo TypeScript no
valida lo que llega por HTTP.

### Integrar en el backend existente (sin crear archivos duplicados)

En PedalLibre, `src/features/auth/resource-roles/dto/create-resource-role.dto.ts`
ya declara `ReconcileResourceRolesDto`. No crees el segundo DTO del andamio:
abre ese archivo y agrega el contrato solo si no existe.

En `resource-roles.controller.ts`, dentro del método `grant`, agrega la rama de
reconciliación **antes** de la validación de `resource_id` individual. Este es
el punto que distingue el guardado de la matriz de una concesión individual:

```ts
if (body.resource_ids !== undefined) {
  const reconcile = validateReconcileBody(body);
  const result = await this.service.reconcileRole(
    reconcile.role_id,
    reconcile.resource_ids,
  );
  res.status(200).json({ message: "Role permissions updated", result });
  return;
}
```

La función `validateReconcileBody` debe existir en ese mismo controller y
rechazar IDs inválidos o duplicados. En `resource-roles.service.ts`, agrega
`reconcileRole` dentro de `ResourceRolesService`, antes de los métodos
privados: valida rol y recursos, y ejecuta altas/reactivaciones/revocaciones
dentro de `withTransaction`. No pongas esa lógica en el controller.

En `resource-roles.routes.ts`, conserva la ruta `/api/concesiones-rol` y su
`POST` protegido. Si falta, encadena el handler dentro del `.route(...)`
existente; no registres una segunda ruta igual:

```ts
.post(
  authenticate,
  authorize,
  this.resourceRolesController.grant.bind(this.resourceRolesController),
)
```

En la copia PedalLibre, estas piezas ya están implementadas. Úsalas para
comparar tu avance; no vuelvas a pegarlas encima ni reemplaces el archivo
completo.

## Diseña la reconciliación

Un conjunto completo se interpreta así:

- ID enviado y concesión inexistente → crearla activa.
- ID enviado y concesión inactiva → reactivarla.
- ID enviado y concesión activa → dejarla como está.
- concesión existente del rol cuyo ID no se envió → revocarla.

El frontend no manda una operación por casilla. Manda el estado final deseado;
el servicio calcula diferencias y las aplica dentro de una transacción.

No confundas las dos acciones que la palabra “eliminar” puede describir:

- La casilla **Eliminar (D)** concede al rol acceso al endpoint `DELETE` de una
  entidad.
- Desmarcar una concesión en esta matriz la revoca en el servicio de
  reconciliación; en PedalLibre se guarda como concesión inactiva
  (`is_allowed = false`), no como eliminación física de la fila.
- El endpoint de administración `DELETE /api/concesiones-rol/:id`, si el
  proyecto lo ofrece, es otra operación y no es necesario para guardar la
  matriz.

Pseudocódigo parcial:

```text
validar rol activo
validar resource_ids como enteros positivos, únicos y activos
abrir transacción
  leer concesiones existentes del rol
  activar o crear cada recurso solicitado
  revocar cada recurso activo que ya no fue solicitado
confirmar transacción
devolver conteos
```

Si cualquier paso falla, la transacción debe revertir los cambios parciales.
Eso evita que una interrupción deje al rol con solo parte de la matriz nueva.

## Validaciones que no se deben omitir

- El cuerpo debe ser un objeto JSON.
- `role_id` debe ser entero positivo y corresponder a un rol activo.
- `resource_ids` debe ser un arreglo de enteros positivos sin duplicados.
- Todos los recursos solicitados deben existir y estar activos.
- Un arreglo vacío debe tener un significado deliberado: en la reconciliación
  reemplaza la matriz por cero permisos; no lo confundas con “no modificar”.
- Errores esperables deben tener respuestas HTTP claras (`400`, `404`, `409`).
- No se debe aceptar `role_id` desde una concesión de un rol diferente al
  autorizado por la operación.

La autorización del endpoint de reconciliación también se comprueba en el
middleware. La interfaz puede ocultar el botón, pero el backend debe rechazar
por sí mismo a quien no tenga el recurso `POST` correspondiente.

## Capas a implementar

1. **DTO/controller:** valida la forma HTTP y normaliza los IDs.
2. **Service:** valida rol y recursos, compara conjuntos y coordina la
   transacción.
3. **Repository:** consulta y escribe concesiones, aceptando el contexto de
   transacción cuando corresponda.
4. **Route:** protege el endpoint con `authenticate` y `authorize`.
5. **Response:** devuelve un conteo útil, no secretos ni objetos internos.

### Completa los archivos existentes

En el backend de referencia las capas ya están creadas. Desde la raíz del
backend, localízalas:

```bash
rg -n "reconcileRole|resource_ids|grant\\(|deactivate\\(" src/features/auth/resource-roles
```

Integra la validación en `resource-roles.controller.ts`, la transacción en
`resource-roles.service.ts`, las consultas/escrituras en
`resource-roles.repository.ts` y los middlewares en
`resource-roles.routes.ts`. Antes de modificar, explica qué capa responde cada
pregunta: forma HTTP, regla de negocio, persistencia o autenticación.

El CRUD de negocio que recibirá los permisos permanece en
`src/features/crud/pedalibre.routes.ts` y sus capas `pedalibre.*`. Este ISS
extiende la feature RBAC de `src/features/auth/resource-roles/`; no crea otro
router CRUD ni traslada la matriz a la carpeta de operaciones de negocio.

En un proyecto nuevo, adapta el DTO anterior a los archivos que ya tenga la
feature. No copies una clase completa de otra aplicación: primero identifica
cómo resuelve errores, transacciones y respuestas tu arquitectura.

En la referencia, el POST acepta tanto una concesión individual
`role_id/resource_id` como la reconciliación de matriz `role_id/resource_ids`.
Si tu proyecto usa rutas separadas, conserva el contrato que hayas acordado;
no mezcles las dos formas sin validación explícita.

## Pruebas que diseñar

Incluye al menos estos casos:

| Caso | Resultado esperado |
|---|---|
| Rol activo y lista válida | alta/reactivación/revocación correctas |
| ID duplicado | `400`, sin cambios |
| ID de recurso inexistente o inactivo | `400`, sin cambios |
| Rol inexistente o inactivo | `404`, sin cambios |
| Token ausente | `401` |
| Token sin permiso de administración | `403` |
| Error simulado durante transacción | rollback completo |
| Lista vacía | revoca todas las concesiones activas de ese rol |

Escribe primero el caso de duplicados y el de reversión: detectan fallas que
una prueba de “respuesta 200” por sí sola no encuentra.

## Comprobación manual segura

Usa una base desechable y IDs de prueba. Con `curl`, inspecciona el contrato sin
incluir credenciales en el repositorio:

```bash
curl -i -X POST "$API_URL/concesiones-rol" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role_id":2,"resource_ids":[11,12]}'
```

Define `API_URL` y `TOKEN` de forma local; no imprimas ni compartas el token.
Luego vuelve a consultar concesiones del rol para comprobar persistencia.

## Criterios de aceptación

- [ ] La reconciliación es idempotente y transaccional.
- [ ] Las entradas inválidas no dejan cambios parciales.
- [ ] La respuesta informa cambios y total activo.
- [ ] La ruta exige JWT y permiso RBAC de administración.
- [ ] Pruebas cubren alta, revocación, duplicados, rol inválido y rollback.
- [ ] Se prueba con datos descartables, no con el único administrador real.

## Cierre

El backend ya tiene un contrato que el frontend puede consumir. Continúa con
[ISS-CR-03](./ISS-CR-03-api-y-panel-frontend.md).
