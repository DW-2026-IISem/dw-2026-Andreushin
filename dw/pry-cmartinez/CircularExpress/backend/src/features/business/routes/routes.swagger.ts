import {
  entityResponse,
  errorRef,
  idParam,
  jsonBody,
  listResponse,
  messageResponse,
} from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Routes";
const id = idParam("Id de la ruta");

export const routesSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Rutas de recolección predefinidas por municipio" }],
  paths: {
    "/api/routes": {
      get: {
        tags: [TAG],
        summary: "Listar rutas activas",
        description: "Ordenadas por municipio y nombre; las rutas con baja lógica no se incluyen.",
        responses: { "200": listResponse("Lista de rutas activas", "routes", "Route") },
      },
      post: {
        tags: [TAG],
        summary: "Crear una ruta",
        requestBody: jsonBody("RouteCreate"),
        responses: {
          "201": entityResponse("Ruta creada", "route", "Route"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/routes/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener una ruta por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Ruta encontrada", "route", "Route"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar una ruta",
        description: "Los campos opcionales que no se envían quedan en null.",
        parameters: [id],
        requestBody: jsonBody("RouteCreate"),
        responses: {
          "200": entityResponse("Ruta actualizada", "route", "Route"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente una ruta",
        parameters: [id],
        requestBody: jsonBody("RoutePatch"),
        responses: {
          "200": entityResponse("Ruta actualizada", "route", "Route"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente una ruta",
        parameters: [id],
        responses: {
          "200": messageResponse("Ruta eliminada", "Ruta eliminada", { id: { type: "integer", example: 1 } }),
          "404": errorRef("NotFound"),
        },
      },
    },
    "/api/routes/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de una ruta",
        description: "Cambia status a inactive; la ruta deja de aparecer en el listado.",
        parameters: [id],
        responses: {
          "200": messageResponse("Ruta desactivada", "Ruta desactivada", { route: { $ref: "#/components/schemas/Route" } }),
          "404": errorRef("NotFound"),
        },
      },
    },
  },
  components: {
    schemas: {
      Route: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Ruta Centro" },
          municipality: { type: "string", example: "Riohacha" },
          description: { type: "string", nullable: true, example: "Recorrido diario por el sector centro de Riohacha" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RouteCreate: {
        type: "object",
        required: ["name", "municipality"],
        description: "El par (name, municipality) es único.",
        properties: {
          name: { type: "string", maxLength: 150, example: "Ruta Centro" },
          municipality: { type: "string", maxLength: 80, example: "Riohacha" },
          description: { type: "string", maxLength: 255, nullable: true, example: "Recorrido diario por el sector centro" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      RoutePatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de RouteCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          municipality: { type: "string", maxLength: 80 },
          description: { type: "string", maxLength: 255, nullable: true, example: "Recorrido interdiario" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
