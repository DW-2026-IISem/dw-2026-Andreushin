import { bearerSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * OpenAPI docs for role assignments (user <-> role). Access mode: JWT + RBAC (403 applied by src/swagger).
 */
const TAG = "Asignaciones usuario-rol";
const ITEM = "#/components/schemas/RoleUser";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico de la asignación (> 0).",
  schema: { type: "integer", minimum: 1 },
};
const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});
const errorResponse = (description: string) => jsonResponse(description, "#/components/schemas/ErrorResponse");

export const roleUsersSwagger = {
  tags: [
    {
      name: TAG,
      description:
        "Asignar, retirar y reactivar el rol de un usuario (primer eslabón de la cadena RBAC); sin borrado físico — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/role-users": {
      get: {
        tags: [TAG],
        summary: "Listar asignaciones activas",
        description: "JWT — con resumen del usuario (sin password) y del rol.",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Asignaciones activas",
            content: {
              "application/json": {
                schema: { type: "object", properties: { assignments: { type: "array", items: { $ref: ITEM } } } },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
      post: {
        tags: [TAG],
        summary: "Asignar rol a usuario",
        description:
          "JWT — `{ userId, roleId }`; usuario y rol activos. Idempotente: si el par existía retirado se reactiva (200).",
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleUserInput" } } } },
        responses: {
          "201": jsonResponse("Asignación creada", ITEM),
          "200": jsonResponse("Asignación reactivada", ITEM),
          "400": errorResponse("Ids inválidos"),
          "401": unauthorizedResponse,
          "404": errorResponse("Usuario o rol inexistente o inactivo"),
          "409": errorResponse("El usuario ya tiene ese rol"),
        },
      },
    },
    "/api/role-users/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener asignación activa",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Asignación", ITEM),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrada o inactiva"),
        },
      },
    },
    "/api/role-users/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Retirar rol (lógico)",
        description: "JWT — el usuario pierde de inmediato los permisos de ese rol.",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Retirada", ITEM),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrada o ya inactiva"),
        },
      },
    },
    "/api/role-users/{id}/reactivate": {
      patch: {
        tags: [TAG],
        summary: "Reactivar asignación",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Reactivada", ITEM),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrada"),
          "409": errorResponse("Ya estaba activa"),
        },
      },
    },
  },
  components: {
    schemas: {
      RoleUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 3 },
          roleId: { type: "integer", example: 3 },
          status: { type: "string", enum: ["active", "inactive"] },
          user: {
            type: "object",
            properties: { id: { type: "integer" }, username: { type: "string" }, email: { type: "string" } },
          },
          role: { type: "object", properties: { id: { type: "integer" }, name: { type: "string", example: "BASCULA" } } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RoleUserInput: {
        type: "object",
        required: ["userId", "roleId"],
        properties: { userId: { type: "integer", minimum: 1 }, roleId: { type: "integer", minimum: 1 } },
      },
    },
  },
};
