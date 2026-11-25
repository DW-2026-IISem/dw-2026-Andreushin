# 🛠 ISS-CR-04 · Integración, pruebas y cierre

**Fase:** integrar, demostrar y evaluar  
**Depende de:** [ISS-CR-03](./ISS-CR-03-api-y-panel-frontend.md)  
**Habilita:** adaptación del panel a otra feature/proyecto

## Objetivo

Comprobar que la matriz administra permisos reales y que cada capa cumple su
responsabilidad. Una pantalla que solo se ve bien no demuestra autorización.

## Flujo completo que debes demostrar

```text
1. Administrador inicia sesión.
2. Frontend carga roles y recursos.
3. Frontend consulta concesiones del rol elegido.
4. Administrador cambia algunas casillas y guarda.
5. Backend valida el rol y los recursos.
6. Service reconcilia concesiones en una transacción.
7. Frontend recibe confirmación y recarga.
8. Una petición a recurso concedido pasa; una no concedida recibe 403.
```

## Pruebas frontend

Prueba el comportamiento, no solamente constantes:

- carga roles y recursos con las envolturas reales;
- lista vacía o catálogo sin roles;
- cambio entre roles con concesiones distintas;
- operaciones con varios endpoints y estado parcial;
- activar/desactivar una columna;
- solicitud de guardado con lista vacía;
- éxito y recarga del rol seleccionado;
- error HTTP con mensaje visible;
- guardar bloqueado durante carga o petición pendiente.

En Angular usa `HttpTestingController` y comprueba método, URL, parámetros,
cuerpo y respuesta. Evita depender de una base real desde una prueba unitaria.

Para reservar la ubicación de pruebas en una pantalla independiente:

```bash
# Solo en una copia de práctica sin panel administrativo existente.
mkdir -p src/app/features/admin/role-permissions
cat > src/app/features/admin/role-permissions/role-permissions-page.spec.ts <<'EOF'
import { describe, it } from "vitest";

describe("RolePermissionsPage", () => {
  it.todo("carga roles, recursos y concesiones del rol elegido");
  it.todo("agrupa recursos y calcula estados marcados y parciales");
  it.todo("envía el conjunto seleccionado y muestra errores del API");
});
EOF
```

En PedalLibre ya existe `src/app/features/admin/admin-page.spec.ts`; agrega los
casos de la matriz a esa suite. Las pruebas del CRUD de negocio están junto a
la feature en `src/app/features/crud/`. No crees una segunda suite ni dupliques
la pantalla de permisos en esa carpeta.

## Pruebas de API e integración

En una base de pruebas:

1. inicia backend y verifica conexión;
2. inicia sesión con una cuenta administradora segura;
3. consulta el catálogo y confirma que no haya duplicados `method + path`;
4. guarda un conjunto conocido para un rol de prueba;
5. consulta concesiones y verifica altas/revocaciones;
6. consulta permisos efectivos con el endpoint de sesión;
7. accede a una ruta autorizada y otra no autorizada;
8. confirma `401` sin JWT y `403` con JWT sin concesión;
9. envía IDs inválidos y confirma que no haya cambios parciales.

No pegues tokens ni contraseñas en capturas, commits o archivos ISS.

## Comandos

Ejecuta cada comando desde la raíz que contiene el `package.json` indicado:

```bash
# Backend
npm run build

# Frontend
cd Frontd-2026
npm test -- --include=src/app/features/admin/admin-page.spec.ts
npm run build
```

Los nombres exactos de scripts pueden cambiar en otra copia. Compruébalos con
`npm run` y sigue el `package.json` local.

## Evidencia para el estudiante

En cada ISS registra qué archivos creó o amplió y qué decisión tomó. Una
captura o reporte debe mostrar el resultado, no sustituir la explicación:

```text
ISS-CR-01: archivo del catálogo + rutas que se compararon
ISS-CR-02: petición de matriz + respuesta + caso inválido
ISS-CR-03: pantalla para un rol + estado parcial de una operación
ISS-CR-04: acceso permitido y denegado + pruebas ejecutadas
```

No agregues capturas con tokens, contraseñas, datos personales ni información
de conexión.

En PedalLibre existe una precaución especial: `npm run db:seed` también ejecuta
la reconciliación de permisos por defecto. Esa reconciliación puede sobrescribir
la matriz que se acaba de configurar manualmente. Antes de repetirla en una
base compartida, inspecciona `src/database/seeders/index.ts` y
`src/features/auth/resource-roles/resource-roles.seeder.ts`. Usa una base
descartable o implementa un seeder de catálogo que no reescriba concesiones.

## Diagnóstico guiado

| Síntoma | Qué revisar primero |
|---|---|
| No aparecen recursos | permiso `GET /api/recursos`, respuesta `resources`, estado activo |
| No aparecen concesiones | `role_id` de consulta, envoltura `grants`, concesiones activas |
| Casilla marca parcialmente | varios endpoints agrupados en una operación |
| Guardar devuelve `400` | IDs positivos/únicos y recursos activos |
| Guardar devuelve `403` | JWT y permiso para el endpoint de reconciliación |
| UI permite una acción que API niega | middleware y recurso `method + path`; la UI no autoriza |
| El permiso desapareció tras sembrar | orden de reconciliación de permisos por defecto |
| Recursos duplicados | catálogo y restricción única de `method + path` |

## Criterios de aceptación consolidados

- [ ] Contrato del panel documentado y coherente con backend.
- [ ] Catálogo de recursos único y sincronizado.
- [ ] Rutas protegidas por JWT y RBAC.
- [ ] Reconciliación transaccional con validación de IDs.
- [ ] Matriz representa estado marcado, desmarcado y parcial.
- [ ] Frontend muestra errores y confirma éxito solo con respuesta del API.
- [ ] Autorización comprobada desde una petición directa, no solo desde la UI.
- [ ] Pruebas unitarias y compilaciones pasan.
- [ ] Seeder probado con una base segura y efectos documentados.
- [ ] Evidencia redactada sin secretos.

## Reflexión de aprendizaje

Al cerrar, explica:

1. ¿Por qué el backend es la autoridad final de permisos?
2. ¿Qué simplifica reconciliar una lista completa en una transacción?
3. ¿Por qué una casilla puede representar varios recursos HTTP?
4. ¿Qué riesgos introduce marcar todos los permisos?
5. ¿Cómo adaptarías el diseño si tu backend no tiene `resource_ids` por rol?

## Cierre de la ruta

El panel está completo cuando la selección visual persiste en el backend y
altera el acceso efectivo de forma comprobable. No marques el ISS como terminado
si solo compila o si la API nunca fue llamada.
