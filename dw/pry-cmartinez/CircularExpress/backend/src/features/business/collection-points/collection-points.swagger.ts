import {
  entityResponse,
  errorRef,
  idParam,
  jsonBody,
  listResponse,
  messageResponse,
} from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "CollectionPoints";
const id = idParam("Id del punto de acopio");

export const collectionPointsSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Puntos de acopio asignados a una ruta de recolección (Route 1:N CollectionPoint)" }],
  paths: {
    "/api/collection-points": {
      get: {
        tags: [TAG],
        summary: "Listar puntos de acopio activos",
        description: "Incluye la ruta de cada punto. Se puede filtrar por ruta con ?routeId=.",
        parameters: [
          {
            name: "routeId",
            in: "query",
            required: false,
            description: "Solo los puntos de esta ruta",
            schema: { type: "integer", minimum: 1, example: 1 },
          },
        ],
        responses: {
          "200": listResponse("Lista de puntos de acopio activos", "collectionPoints", "CollectionPoint"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear un punto de acopio",
        description: "La ruta debe existir y estar activa.",
        requestBody: jsonBody("CollectionPointCreate"),
        responses: {
          "201": entityResponse("Punto de acopio creado", "collectionPoint", "CollectionPoint"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/collection-points/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener un punto de acopio por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Punto de acopio encontrado", "collectionPoint", "CollectionPoint"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar un punto de acopio",
        description: "Los campos opcionales que no se envían quedan en null.",
        parameters: [id],
        requestBody: jsonBody("CollectionPointCreate"),
        responses: {
          "200": entityResponse("Punto de acopio actualizado", "collectionPoint", "CollectionPoint"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente un punto de acopio",
        parameters: [id],
        requestBody: jsonBody("CollectionPointPatch"),
        responses: {
          "200": entityResponse("Punto de acopio actualizado", "collectionPoint", "CollectionPoint"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente un punto de acopio",
        parameters: [id],
        responses: {
          "200": messageResponse("Punto de acopio eliminado", "Punto de acopio eliminado", {
            id: { type: "integer", example: 1 },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
    "/api/collection-points/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de un punto de acopio",
        description: "Cambia status a inactive; el punto deja de aparecer en el listado.",
        parameters: [id],
        responses: {
          "200": messageResponse("Punto de acopio desactivado", "Punto de acopio desactivado", {
            collectionPoint: { $ref: "#/components/schemas/CollectionPoint" },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
  },
  components: {
    schemas: {
      CollectionPoint: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Punto Plaza de Mercado" },
          address: { type: "string", nullable: true, example: "Calle 2 # 7-45, Riohacha" },
          description: { type: "string", nullable: true, example: "Punto de acopio de la ruta centro" },
          routeId: { type: "integer", example: 1 },
          route: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Ruta Centro" },
              municipality: { type: "string", example: "Riohacha" },
            },
          },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CollectionPointCreate: {
        type: "object",
        required: ["name", "routeId"],
        description: "El par (name, routeId) es único; la ruta debe existir y estar activa.",
        properties: {
          name: { type: "string", maxLength: 150, example: "Punto Plaza de Mercado" },
          routeId: { type: "integer", minimum: 1, example: 1 },
          address: { type: "string", maxLength: 255, nullable: true, example: "Calle 2 # 7-45, Riohacha" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      CollectionPointPatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de CollectionPointCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          routeId: { type: "integer", minimum: 1 },
          address: { type: "string", maxLength: 255, nullable: true },
          description: { type: "string", maxLength: 255, nullable: true, example: "Abre de lunes a sábado" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
