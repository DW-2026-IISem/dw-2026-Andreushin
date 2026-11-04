import { Application, Request, Response } from "express";
import { authenticate, authorize } from "../access";
import { handleError } from "../../../shared/http/handleError";
import { ArchiveRepository } from "./archive.repository";

const repository = new ArchiveRepository();

/**
 * `/api/archive/<entity>`: path segment, list key (same `{ plural }` envelope as the
 * feature list) and read. The `archive` prefix is deliberate: `/api/recyclers/all` would
 * also match the `/api/recyclers/:id` resource, and any role allowed to read by id would
 * pass `authorize`.
 */
export const ARCHIVE_ENTITIES = [
  { path: "recyclers", key: "recyclers", read: repository.recyclers, noun: "recicladores" },
  { path: "materials", key: "materials", read: repository.materials, noun: "materiales" },
  { path: "routes", key: "routes", read: repository.routes, noun: "rutas" },
  { path: "collection-points", key: "points", read: repository.collectionPoints, noun: "puntos de recolección" },
  { path: "collections", key: "collections", read: repository.collections, noun: "recolecciones" },
  { path: "weighings", key: "weighings", read: repository.weighings, noun: "pesajes" },
  { path: "settlements", key: "settlements", read: repository.settlements, noun: "liquidaciones" },
  { path: "users", key: "users", read: repository.users, noun: "usuarios" },
  { path: "roles", key: "roles", read: repository.roles, noun: "roles" },
  { path: "resources", key: "resources", read: repository.resources, noun: "recursos" },
  { path: "role-users", key: "assignments", read: repository.roleUsers, noun: "asignaciones usuario-rol" },
  { path: "resource-roles", key: "grants", read: repository.resourceRoles, noun: "concesiones rol-recurso" },
] as const;

export class ArchiveRoutes {
  public routes(app: Application): void {
    // JWT + RBAC, read only: authenticate (401) -> authorize (403) -> full list.
    for (const { path, key, read } of ARCHIVE_ENTITIES) {
      app.route(`/api/archive/${path}`).get(authenticate, authorize, async (_req: Request, res: Response) => {
        try {
          return res.status(200).json({ [key]: await read() });
        } catch (error) {
          return handleError(res, error);
        }
      });
    }
  }
}
