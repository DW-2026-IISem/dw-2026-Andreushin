import { bearerSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * OpenAPI docs for the roles feature. Access mode: JWT + RBAC (403 applied by src/swagger).
 */
const TAG = "Roles";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico (> 0). Si no lo es, la API responde 400.",
  schema: { type: "integer", minimum: 1 },
};

const jsonBody = (ref: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: ref } } },
});

const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});

const errorResponse = (description: string) => jsonResponse(description, "#/components/schemas/ErrorResponse");

const ITEM = "#/components/schemas/Role";

export const rolesSwagger = {
  tags: [{ name: TAG, description: "Roles del personal; el nombre no autoriza nada, solo sus concesiones activas — **JWT + RBAC**" }],
  paths: {
    "/api/roles": {
      get: {
        tags: [TAG],
        summary: "Listar roles activos",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "roles activos",
            content: {
              "application/json": {
                schema: { type: "object", properties: { roles: { type: "array", items: { $ref: ITEM } } } },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear role",
        description: "JWT — el rol nace sin permisos; se conceden con /api/resource-roles (ISS-12).",
        security: bearerSecurity,
        requestBody: jsonBody("#/components/schemas/RoleInput"),
        responses: {
          "201": jsonResponse("Creado", ITEM),
          "400": errorResponse("Datos inválidos"),
          "401": unauthorizedResponse,
          "409": errorResponse("Ya existe"),
        },
      },
    },
    "/api/roles/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener por id (activo)",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Encontrado", ITEM),
          "400": errorResponse("Id inválido"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar (PUT)",
        description: "JWT — status no se envía: solo cambia con deactivate.",
        security: bearerSecurity,
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/RoleUpdate"),
        responses: {
          "200": jsonResponse("Actualizado", ITEM),
          "400": errorResponse("Datos inválidos"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
          "409": errorResponse("Ya existe"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar (PATCH)",
        security: bearerSecurity,
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/RolePatch"),
        responses: {
          "200": jsonResponse("Actualizado", ITEM),
          "400": errorResponse("Cuerpo vacío o dato inválido"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
          "409": errorResponse("Ya existe"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar (físico)",
        description: "JWT — 409 mientras tenga asignaciones o concesiones (FK RESTRICT): se desactiva en su lugar.",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Eliminado",
            content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } },
          },
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado"),
          "409": errorResponse("Tiene datos relacionados"),
        },
      },
    },
    "/api/roles/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Desactivar (lógico)",
        description: "JWT — efecto inmediato en la cadena RBAC: el eslabón inactivo deja de autorizar.",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Desactivado", ITEM),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o ya inactivo"),
        },
      },
    },
  },
  components: {
    schemas: {
      Role: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", pattern: "^[A-Za-z][A-Za-z_]{1,79}$", description: "Se guarda en MAYÚSCULAS", example: "BASCULA" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RoleInput: {
        type: "object",
        required: ["name"],
        example: { name: "AUDITORIA", description: "Solo lectura" },
        properties: {
          name: { type: "string", pattern: "^[A-Za-z][A-Za-z_]{1,79}$", description: "Se guarda en MAYÚSCULAS", example: "BASCULA" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      RoleUpdate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", pattern: "^[A-Za-z][A-Za-z_]{1,79}$", description: "Se guarda en MAYÚSCULAS", example: "BASCULA" },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
      RolePatch: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", pattern: "^[A-Za-z][A-Za-z_]{1,79}$", description: "Se guarda en MAYÚSCULAS", example: "BASCULA" },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
    },
  },
};
