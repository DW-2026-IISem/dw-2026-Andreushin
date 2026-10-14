import { bearerSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * OpenAPI docs for the recursos feature. Access mode: JWT; RBAC (403) is added in ISS-13.
 */
const TAG = "Recursos";

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

const ITEM = "#/components/schemas/Resource";

export const resourcesSwagger = {
  tags: [{ name: TAG, description: "Catálogo de puntos de acceso protegibles: par (method, path) con la ruta en patrón — **JWT**" }],
  paths: {
    "/api/resources": {
      get: {
        tags: [TAG],
        summary: "Listar recursos activos",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "recursos activos",
            content: {
              "application/json": {
                schema: { type: "object", properties: { resources: { type: "array", items: { $ref: ITEM } } } },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear recurso",
        description: "JWT — (method, path) es único (409); concederlo a un rol no requiere desplegar código.",
        security: bearerSecurity,
        requestBody: jsonBody("#/components/schemas/ResourceInput"),
        responses: {
          "201": jsonResponse("Creado", ITEM),
          "400": errorResponse("Datos inválidos"),
          "401": unauthorizedResponse,
          "409": errorResponse("Ya existe"),
        },
      },
    },
    "/api/resources/{id}": {
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
        requestBody: jsonBody("#/components/schemas/ResourceUpdate"),
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
        requestBody: jsonBody("#/components/schemas/ResourcePatch"),
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
    "/api/resources/{id}/deactivate": {
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
      Resource: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], example: "POST" },
          path: { type: "string", pattern: "^/api(/([a-z0-9-]+|:[A-Za-z]+))+$", example: "/api/weighings/:id" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ResourceInput: {
        type: "object",
        required: ["method", "path"],
        example: { method: "GET", path: "/api/reports/settlements/:id", description: "Reporte de liquidación" },
        properties: {
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], example: "POST" },
          path: { type: "string", pattern: "^/api(/([a-z0-9-]+|:[A-Za-z]+))+$", example: "/api/weighings/:id" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      ResourceUpdate: {
        type: "object",
        required: ["method", "path"],
        properties: {
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], example: "POST" },
          path: { type: "string", pattern: "^/api(/([a-z0-9-]+|:[A-Za-z]+))+$", example: "/api/weighings/:id" },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
      ResourcePatch: {
        type: "object",
        minProperties: 1,
        properties: {
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], example: "POST" },
          path: { type: "string", pattern: "^/api(/([a-z0-9-]+|:[A-Za-z]+))+$", example: "/api/weighings/:id" },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
    },
  },
};
