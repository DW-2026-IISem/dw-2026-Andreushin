import {
  entityResponse,
  errorRef,
  idParam,
  jsonBody,
  listResponse,
  messageResponse,
} from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Collections";
const id = idParam("Id de la jornada");
const idFilter = (name: string, description: string) => ({
  name,
  in: "query",
  required: false,
  description,
  schema: { type: "integer", minimum: 1, example: 1 },
});

export const collectionsSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Jornadas de recolección de un reciclador en una ruta (Recycler 1:N, Route 1:N)" }],
  paths: {
    "/api/collections": {
      get: {
        tags: [TAG],
        summary: "Listar jornadas activas",
        description: "Más recientes primero; incluye reciclador y ruta. Filtros opcionales por reciclador y ruta.",
        parameters: [idFilter("recyclerId", "Solo jornadas de este reciclador"), idFilter("routeId", "Solo jornadas de esta ruta")],
        responses: {
          "200": listResponse("Lista de jornadas activas", "collections", "Collection"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Registrar una jornada",
        description: "Reciclador y ruta deben existir y estar activos; la fecha no puede ser futura (por defecto, hoy).",
        requestBody: jsonBody("CollectionCreate"),
        responses: {
          "201": entityResponse("Jornada registrada", "collection", "Collection"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/collections/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener una jornada por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Jornada encontrada", "collection", "Collection"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar una jornada",
        description: "description omitida queda en null y collectionDate omitida toma la fecha de hoy.",
        parameters: [id],
        requestBody: jsonBody("CollectionCreate"),
        responses: {
          "200": entityResponse("Jornada actualizada", "collection", "Collection"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente una jornada",
        parameters: [id],
        requestBody: jsonBody("CollectionPatch"),
        responses: {
          "200": entityResponse("Jornada actualizada", "collection", "Collection"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente una jornada",
        parameters: [id],
        responses: {
          "200": messageResponse("Jornada eliminada", "Jornada de recolección eliminada", {
            id: { type: "integer", example: 1 },
          }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/collections/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de una jornada",
        description: "Cambia status a inactive; la jornada deja de aparecer en el listado.",
        parameters: [id],
        responses: {
          "200": messageResponse("Jornada desactivada", "Jornada de recolección desactivada", {
            collection: { $ref: "#/components/schemas/Collection" },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
  },
  components: {
    schemas: {
      Collection: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Jornada Ruta Centro 2026-10-01" },
          description: { type: "string", nullable: true, example: "Recolección de cartón y PET en el centro" },
          collectionDate: { type: "string", format: "date", example: "2026-10-01" },
          recyclerId: { type: "integer", example: 1 },
          recycler: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Lourdes Rodríguez Saiz" },
              documentNumber: { type: "string", nullable: true, example: "6599808056" },
            },
          },
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
      CollectionCreate: {
        type: "object",
        required: ["name", "recyclerId", "routeId"],
        description: "Una jornada por reciclador, ruta y fecha.",
        properties: {
          name: { type: "string", maxLength: 150, example: "Jornada Ruta Centro 2026-10-01" },
          recyclerId: { type: "integer", minimum: 1, example: 1 },
          routeId: { type: "integer", minimum: 1, example: 1 },
          collectionDate: { type: "string", format: "date", example: "2026-10-01", description: "YYYY-MM-DD, no futura; por defecto hoy" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      CollectionPatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de CollectionCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          recyclerId: { type: "integer", minimum: 1 },
          routeId: { type: "integer", minimum: 1 },
          collectionDate: { type: "string", format: "date" },
          description: { type: "string", maxLength: 255, nullable: true, example: "Se recogieron 120 kg de cartón" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
