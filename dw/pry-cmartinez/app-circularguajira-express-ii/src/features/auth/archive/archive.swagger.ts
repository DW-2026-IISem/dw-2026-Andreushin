import { ARCHIVE_ENTITIES } from "./archive.routes";

/**
 * OpenAPI docs for the archive: full lists, including inactive rows.
 * Access mode: JWT + RBAC (bearerAuth, 401 and 403 are applied by src/swagger).
 */
const TAG = "Archivo";

export const archiveSwagger = {
  tags: [{ name: TAG, description: "Listados completos con registros inactivos (solo lectura; concedido a ADMIN)" }],
  paths: Object.fromEntries(
    ARCHIVE_ENTITIES.map(({ path, key, noun }) => [
      `/api/archive/${path}`,
      {
        get: {
          tags: [TAG],
          summary: `Listar ${noun}, incluidos los inactivos`,
          responses: {
            "200": {
              description: `Objeto con la clave \`${key}\` y todas las filas, cualquiera sea su estado`,
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
    ])
  ),
};
