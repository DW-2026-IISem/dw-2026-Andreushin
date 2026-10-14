import { bearerSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * OpenAPI docs for grants (role <-> resource): the permission itself. There is no
 * Permission entity; granting is creating or reactivating a resource_roles row.
 * Access mode: JWT + RBAC (403 applied by src/swagger).
 */
const TAG = "Concesiones rol-recurso";
const ITEM = "#/components/schemas/ResourceRole";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico de la concesión (> 0).",
  schema: { type: "integer", minimum: 1 },
};
const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});
const errorResponse = (description: string) => jsonResponse(description, "#/components/schemas/ErrorResponse");

export const resourceRolesSwagger = {
  tags: [
    {
      name: TAG,
      description: "Conceder, retirar y reactivar recursos a un rol: **el permiso**; sin despliegue ni borrado físico — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/resource-roles": {
      get: {
        tags: [TAG],
        summary: "Listar concesiones activas",
        description: "JWT — filtros `?roleId=` (permisos de un rol) y `?resourceId=` (roles que conceden un recurso).",
        security: bearerSecurity,
        parameters: [
          { name: "roleId", in: "query", required: false, schema: { type: "integer", minimum: 1 } },
          { name: "resourceId", in: "query", required: false, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "Concesiones activas",
            content: {
              "application/json": {
                schema: { type: "object", properties: { grants: { type: "array", items: { $ref: ITEM } } } },
              },
            },
          },
          "400": errorResponse("Filtro inválido"),
          "401": unauthorizedResponse,
        },
      },
      post: {
        tags: [TAG],
        summary: "Conceder recurso a rol (crear permiso)",
        description:
          "JWT — `{ roleId, resourceId }`; rol y recurso activos. Idempotente: si existía retirada se reactiva (200). " +
          "Efecto inmediato: la siguiente petición ya consulta la nueva matriz.",
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceRoleInput" } } } },
        responses: {
          "201": jsonResponse("Permiso concedido", ITEM),
          "200": jsonResponse("Permiso reactivado", ITEM),
          "400": errorResponse("Ids inválidos"),
          "401": unauthorizedResponse,
          "404": errorResponse("Rol o recurso inexistente o inactivo"),
          "409": errorResponse("El rol ya tiene ese recurso"),
        },
      },
    },
    "/api/resource-roles/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener concesión activa",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Concesión", ITEM),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrada o inactiva"),
        },
      },
    },
    "/api/resource-roles/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Retirar permiso (lógico)",
        description: "JWT — solo se pierde esa operación; los demás permisos del rol siguen vigentes.",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Retirado", ITEM),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrada o ya inactiva"),
        },
      },
    },
    "/api/resource-roles/{id}/reactivate": {
      patch: {
        tags: [TAG],
        summary: "Reactivar permiso",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Reactivado", ITEM),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrada"),
          "409": errorResponse("Ya estaba activa"),
        },
      },
    },
  },
  components: {
    schemas: {
      ResourceRole: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          roleId: { type: "integer", example: 3 },
          resourceId: { type: "integer", example: 40 },
          status: { type: "string", enum: ["active", "inactive"] },
          role: { type: "object", properties: { id: { type: "integer" }, name: { type: "string", example: "BASCULA" } } },
          resource: {
            type: "object",
            properties: {
              id: { type: "integer" },
              method: { type: "string", example: "POST" },
              path: { type: "string", example: "/api/weighings" },
              description: { type: "string", nullable: true },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ResourceRoleInput: {
        type: "object",
        required: ["roleId", "resourceId"],
        properties: { roleId: { type: "integer", minimum: 1 }, resourceId: { type: "integer", minimum: 1 } },
      },
    },
  },
};
