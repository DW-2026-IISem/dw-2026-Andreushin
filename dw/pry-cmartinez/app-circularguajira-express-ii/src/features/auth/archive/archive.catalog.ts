/**
 * Archive resources, in a file of their own so the catalog does not import the routes (and
 * the models behind them). `archive.test.ts` checks they match ARCHIVE_ENTITIES.
 */
export const ARCHIVE_RESOURCES = [
  ["recyclers", "recicladores"],
  ["materials", "materiales"],
  ["routes", "rutas"],
  ["collection-points", "puntos de recolección"],
  ["collections", "recolecciones"],
  ["weighings", "pesajes"],
  ["settlements", "liquidaciones"],
  ["users", "usuarios"],
  ["roles", "roles"],
  ["resources", "recursos"],
  ["role-users", "asignaciones usuario-rol"],
  ["resource-roles", "concesiones rol-recurso"],
] as const;
