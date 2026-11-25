# Ruta ISS-Crud · Panel de roles y permisos

## Propósito

Esta ruta enseña a diseñar e integrar un panel que asigna permisos por rol y
recurso. Se apoya en el panel **Roles y permisos** de PedalLibre, pero está
escrita para que otro equipo pueda reproducir la arquitectura en su propio
proyecto.

No es un volcado del código terminado: cada ISS guía decisiones, contratos,
responsabilidades y verificaciones. Los fragmentos son ejemplos parciales;
cada estudiante debe adaptarlos a sus modelos, nombres, autenticación y reglas.

La guía distingue dos maneras de trabajar:

- **En PedalLibre:** las carpetas `crud` ya existen. Abre los archivos
  indicados, localiza el bloque que se menciona y agrega o reemplaza solo el
  fragmento señalado. No ejecutes `cat >` sobre archivos existentes ni pegues
  un archivo completo encima de tu implementación.
- **En un proyecto nuevo:** puedes usar los comandos y andamios `TODO` para
  crear la estructura inicial. `cat > archivo` reemplaza un archivo existente;
  ejecútalo solo después de comprobar que ese archivo no existe.

Cada ISS incluye una sección de integración manual con la ruta exacta, el punto
de inserción y el fragmento que se agrega. Si el mismo método o bloque ya está
implementado, compáralo y no lo dupliques.

Los pasos de edición usan estos verbos de forma literal: **AGREGAR** significa
insertar el fragmento dentro del arreglo, clase o plantilla indicado;
**REEMPLAZAR** significa sustituir únicamente el método o bloque nombrado, no
el archivo completo. Si una sección no indica reemplazo, conserva el código
existente y añade solo lo que falta.

Los comandos usan Bash (Linux/WSL). Quien trabaje en PowerShell debe adaptar
la sintaxis del heredoc, no las rutas ni el contenido conceptual.

## Contexto de referencia

- Frontend: Angular standalone, TypeScript, Signals, `HttpClient`, PrimeNG y
  Tailwind CSS.
- Backend: Express, TypeScript y Sequelize, organizado por features.
- Autorización: RBAC. El usuario tiene un `role_id`; el rol recibe recursos a
  través de concesiones. Un recurso se identifica por el par HTTP
  `method + path`.
- Panel estudiado: consulta roles, recursos y concesiones; agrupa los recursos
  por entidad; muestra cuatro columnas CRUD; guarda el conjunto de recursos
  seleccionados en una sola petición.
- Recorrido de una petición:

  ```text
  AdminPage → AdminApi → HttpClient → interceptor JWT
  → ruta Express → authenticate → authorize
  → controller → service → repository → modelo → base de datos
  ```

La interfaz no accede a Sequelize ni calcula permisos efectivos. El middleware
del backend continúa siendo la autoridad de acceso.

## Ubicación real en PedalLibre

Este proyecto ya organiza el CRUD de negocio dentro de carpetas `crud`. La
guía debe leerse respetando esa estructura; no crees una segunda carpeta para
duplicar lo existente:

| Responsabilidad | Backend | Frontend |
|---|---|---|
| Rutas y lógica del CRUD de negocio | `src/features/crud/pedalibre.*` | `Frontd-2026/src/app/features/crud/` |
| Catálogo y concesiones RBAC | `src/features/auth/resources/` y `src/features/auth/resource-roles/` | `Frontd-2026/src/app/core/services/admin-api.ts` |
| Panel administrativo Roles y permisos | Protegido por las rutas RBAC anteriores | `Frontd-2026/src/app/features/admin/admin-page.ts` y `admin-page.html` |

El panel administra permisos sobre las rutas CRUD, pero no es la pantalla CRUD
de negocio. Por eso, al seguir la guía en PedalLibre, las rutas de negocio se
consultan o amplían en `src/features/crud/`, mientras que la matriz de permisos
se integra en el panel existente de `features/admin/`. Los andamios en una
carpeta `role-permissions` son únicamente una opción para una copia de práctica
que todavía no tenga pantalla administrativa.

## Secuencia de la ruta

| ISS | Tema | Resultado |
|---|---|---|
| [ISS-CR-00](./ISS-CR-00-contexto-y-contrato.md) | Contexto, vocabulario y requisitos | Contrato y alcance acordados antes de programar |
| [ISS-CR-01](./ISS-CR-01-catalogo-y-recursos-backend.md) | Catálogo de recursos y operaciones backend | Recursos únicos, rutas protegidas y CRUD coherente |
| [ISS-CR-02](./ISS-CR-02-matriz-y-reconciliacion-backend.md) | Reconciliación de permisos por rol | Endpoint atómico, validado y transaccional |
| [ISS-CR-03](./ISS-CR-03-api-y-panel-frontend.md) | Cliente HTTP y matriz frontend | Tabla CRUD consultable y editable con errores visibles |
| [ISS-CR-04](./ISS-CR-04-integracion-y-cierre.md) | Integración, pruebas y cierre | Evidencia verificable de punta a punta |

## Dependencias

Antes de comenzar deben existir:

- entidades de usuarios y roles;
- autenticación funcional y un usuario administrador de pruebas;
- una entidad de recursos con `method` y `path`;
- una entidad de concesiones con relación a rol y recurso;
- middleware de autenticación y autorización;
- una conexión de frontend con la API y una estrategia de token.

En un proyecto nuevo, termina primero las unidades de Auth, Roles, Resources y
Access Control. No implementes el panel antes de acordar el contrato del API.

## Alcance y límites

Esta ruta cubre el panel que concede o revoca **permisos por rol**. No enseña a
construir todos los CRUD del negocio, ni a reemplazar el login, ni a administrar
roles de usuario mediante una tabla intermedia.

En PedalLibre el rol del usuario se guarda en `users.role_id`. El vínculo de
autorización es `role_resources` → `resources`; no hay que inventar un pivote
`role_users`.

El ISS-CR-00 muestra cómo preparar las carpetas `crud` de backend y frontend,
qué responsabilidad tiene cada archivo y cómo registrar una entidad de punta
a punta. Los ISS siguientes muestran dónde agregar los fragmentos a esos
archivos existentes para que la ruta aparezca en la matriz Roles y permisos.

Las operaciones Crear, Leer, Actualizar y Eliminar representan permisos sobre
los endpoints del catálogo. No sustituyen la validación del servicio, no evitan
las reglas del negocio y no significan que toda petición sea segura por el solo
hecho de estar visible en la interfaz.

## Reglas de trabajo

1. Revisa el modelo y los endpoints propios del proyecto antes de escribir.
2. Escribe el contrato HTTP antes de conectar la vista.
3. Mantén responsabilidades separadas; la vista no contiene SQL ni reglas RBAC.
4. No ocultes errores: un fallo al cargar o guardar debe mostrarse.
5. Prueba tanto permisos concedidos como denegados.
6. No copies credenciales, secretos JWT ni datos reales a ejemplos.
7. No ejecutes seeders que reconcilian permisos sobre una base personalizada
   sin entender sus efectos.
8. Reemplaza cada `TODO` con la regla de tu aplicación y retira los errores
   temporales del andamio antes de dar el ISS por terminado.

## Evidencia final

Al terminar, conserva evidencia sin secretos de:

- catálogo cargado y sin duplicados;
- matriz para un rol de prueba;
- petición de guardado y su respuesta;
- permisos efectivos observados en el backend;
- acceso permitido y denegado en una ruta protegida;
- pruebas frontend y compilación backend.
