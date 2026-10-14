/**
 * Catalog of the protected resources of the API (single source of truth).
 *
 * A resource is a (method, path) pair with the path as a pattern; a permission is the
 * grant of a resource to a role. The resources seeder loads this list and the grants
 * seeder (ISS-12) derives the role matrix from `roles`. ADMIN receives every resource;
 * `roles` lists the other roles that receive it (least privilege per responsibility):
 *
 *   LOGISTICA  routes, collection points, recyclers and collection intake
 *   BASCULA    weighings (and collections, which are created with their weighings)
 *   PLANTA     material catalog; reads collections and weighings
 *   FINANZAS   rates and settlements
 *
 * Session endpoints (login, refresh, logout, profile) are not resources: they are OPEN or
 * JWT modes and do not depend on the matrix.
 */
export const ROLE_NAMES = ["ADMIN", "LOGISTICA", "BASCULA", "PLANTA", "FINANZAS"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];
type GrantedRole = Exclude<RoleName, "ADMIN">;

export interface CatalogResource {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  // Roles other than ADMIN that receive this resource.
  roles: readonly GrantedRole[];
}

interface CrudAccess {
  read: readonly GrantedRole[];
  write: readonly GrantedRole[];
}

// The 7 operations of a standard feature. The physical delete is ADMIN-only everywhere.
const crud = (base: string, noun: string, access: CrudAccess): CatalogResource[] => [
  { method: "GET", path: base, description: `Listar ${noun}`, roles: access.read },
  { method: "GET", path: `${base}/:id`, description: `Consultar ${noun}`, roles: access.read },
  { method: "POST", path: base, description: `Crear ${noun}`, roles: access.write },
  { method: "PUT", path: `${base}/:id`, description: `Reemplazar ${noun}`, roles: access.write },
  { method: "PATCH", path: `${base}/:id`, description: `Modificar ${noun}`, roles: access.write },
  { method: "DELETE", path: `${base}/:id`, description: `Eliminar ${noun} (físico)`, roles: [] },
  { method: "PATCH", path: `${base}/:id/deactivate`, description: `Desactivar ${noun}`, roles: access.write },
];

const ADMIN_ONLY: CrudAccess = { read: [], write: [] };

export const RESOURCE_CATALOG: readonly CatalogResource[] = [
  // ── Business (Phase I) ────────────────────────────────────────
  ...crud("/api/recyclers", "recicladores", { read: ["LOGISTICA", "BASCULA", "FINANZAS"], write: ["LOGISTICA"] }),
  ...crud("/api/materials", "materiales", { read: ["LOGISTICA", "BASCULA", "PLANTA", "FINANZAS"], write: ["PLANTA"] }),
  { method: "GET", path: "/api/materials/:id/rates", description: "Historial de tarifas", roles: ["BASCULA", "PLANTA", "FINANZAS"] },
  { method: "POST", path: "/api/materials/:id/rates", description: "Registrar tarifa", roles: ["FINANZAS"] },
  { method: "GET", path: "/api/materials/:id/rates/current", description: "Tarifa aplicable en una fecha", roles: ["LOGISTICA", "BASCULA", "PLANTA", "FINANZAS"] },
  ...crud("/api/routes", "rutas", { read: ["LOGISTICA", "BASCULA"], write: ["LOGISTICA"] }),
  { method: "GET", path: "/api/routes/:id/points", description: "Puntos de una ruta", roles: ["LOGISTICA", "BASCULA"] },
  ...crud("/api/collection-points", "puntos de recolección", { read: ["LOGISTICA"], write: ["LOGISTICA"] }),
  ...crud("/api/collections", "recolecciones", { read: ["LOGISTICA", "BASCULA", "PLANTA", "FINANZAS"], write: ["LOGISTICA", "BASCULA"] }),
  ...crud("/api/weighings", "pesajes", { read: ["LOGISTICA", "BASCULA", "PLANTA", "FINANZAS"], write: ["BASCULA"] }),
  { method: "GET", path: "/api/settlements", description: "Listar liquidaciones", roles: ["FINANZAS"] },
  { method: "GET", path: "/api/settlements/:id", description: "Consultar liquidación", roles: ["FINANZAS"] },
  { method: "GET", path: "/api/settlements/:id/verify", description: "Verificar liquidación", roles: ["FINANZAS", "PLANTA"] },
  { method: "POST", path: "/api/settlements", description: "Liquidar recolección", roles: ["FINANZAS"] },
  { method: "PUT", path: "/api/settlements/:id", description: "Actualizar notas de liquidación (PUT)", roles: ["FINANZAS"] },
  { method: "PATCH", path: "/api/settlements/:id", description: "Actualizar notas de liquidación (PATCH)", roles: ["FINANZAS"] },
  { method: "DELETE", path: "/api/settlements/:id", description: "Eliminar liquidación anulada (físico)", roles: [] },
  { method: "PATCH", path: "/api/settlements/:id/void", description: "Anular liquidación", roles: ["FINANZAS"] },

  // ── Auth administration (Phase II): ADMIN only ────────────────
  ...crud("/api/users", "usuarios", ADMIN_ONLY),
  { method: "PATCH", path: "/api/users/:id/password", description: "Cambiar contraseña de usuario", roles: [] },
  { method: "GET", path: "/api/users/:id/permissions", description: "Permisos efectivos de usuario", roles: [] },
  ...crud("/api/roles", "roles", ADMIN_ONLY),
  ...crud("/api/resources", "recursos", ADMIN_ONLY),
  // ISS-12: user <-> role assignments and role <-> resource grants.
  { method: "GET", path: "/api/role-users", description: "Listar asignaciones usuario-rol", roles: [] },
  { method: "GET", path: "/api/role-users/:id", description: "Consultar asignación usuario-rol", roles: [] },
  { method: "POST", path: "/api/role-users", description: "Asignar rol a usuario", roles: [] },
  { method: "PATCH", path: "/api/role-users/:id/deactivate", description: "Retirar rol a usuario", roles: [] },
  { method: "PATCH", path: "/api/role-users/:id/reactivate", description: "Reactivar rol a usuario", roles: [] },
  { method: "GET", path: "/api/resource-roles", description: "Listar concesiones rol-recurso", roles: [] },
  { method: "GET", path: "/api/resource-roles/:id", description: "Consultar concesión rol-recurso", roles: [] },
  { method: "POST", path: "/api/resource-roles", description: "Conceder recurso a rol", roles: [] },
  { method: "PATCH", path: "/api/resource-roles/:id/deactivate", description: "Retirar recurso a rol", roles: [] },
  { method: "PATCH", path: "/api/resource-roles/:id/reactivate", description: "Reactivar recurso a rol", roles: [] },
];

/**
 * Operations that are deliberately NOT resources: OPEN or JWT-only, so no grant applies.
 * Login, refresh and logout come before any identity (OPEN); profile, own permissions and
 * own sessions come from being authenticated (JWT).
 */
export const NON_RESOURCE_OPERATIONS: readonly string[] = [
  "POST /api/session/login",
  "POST /api/session/refresh",
  "POST /api/session/logout",
  "GET /api/session/profile",
  "GET /api/session/permissions",
  "GET /api/sessions",
  "DELETE /api/sessions",
  "PATCH /api/sessions/deactivate-all",
  "GET /api/sessions/:id",
  "PATCH /api/sessions/:id/deactivate",
];

// Resources a role receives (ADMIN: all of them). Derived from the catalog, never duplicated.
export const resourcesForRole = (role: RoleName): readonly CatalogResource[] =>
  role === "ADMIN" ? RESOURCE_CATALOG : RESOURCE_CATALOG.filter((resource) => resource.roles.includes(role));
