import { entityResponse, errorRef, idParam, jsonBody, listResponse, messageResponse } from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Plants";
const id = idParam("Id de la planta");

export const plantsSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Plantas de clasificación, acopio y aprovechamiento" }],
  paths: {
    "/api/plants": {
      get: {
        tags: [TAG],
        summary: "Listar plantas activas",
        description: "Ordenadas por municipio y nombre; filtro opcional por municipio.",
        parameters: [
          {
            name: "municipality",
            in: "query",
            required: false,
            description: "Solo plantas de este municipio",
            schema: { type: "string", maxLength: 80, example: "Riohacha" },
          },
        ],
        responses: {
          "200": listResponse("Lista de plantas activas", "plants", "Plant"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear una planta",
        requestBody: jsonBody("PlantCreate"),
        responses: {
          "201": entityResponse("Planta creada", "plant", "Plant"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/plants/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener una planta por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Planta encontrada", "plant", "Plant"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar una planta",
        description: "Los campos opcionales que no se envían quedan en null.",
        parameters: [id],
        requestBody: jsonBody("PlantCreate"),
        responses: {
          "200": entityResponse("Planta actualizada", "plant", "Plant"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente una planta",
        parameters: [id],
        requestBody: jsonBody("PlantPatch"),
        responses: {
          "200": entityResponse("Planta actualizada", "plant", "Plant"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente una planta",
        description: "Responde 409 si la planta ya está referenciada por otros registros.",
        parameters: [id],
        responses: {
          "200": messageResponse("Planta eliminada", "Planta eliminada", { id: { type: "integer", example: 1 } }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/plants/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de una planta",
        description: "Cambia status a inactive; la planta deja de aparecer en el listado.",
        parameters: [id],
        responses: {
          "200": messageResponse("Planta desactivada", "Planta desactivada", {
            plant: { $ref: "#/components/schemas/Plant" },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
  },
  components: {
    schemas: {
      Plant: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Planta de Clasificación Riohacha" },
          municipality: { type: "string", example: "Riohacha" },
          address: { type: "string", nullable: true, example: "Calle 15 # 10-20, Riohacha" },
          description: { type: "string", nullable: true, example: "Clasificación y compactación de plásticos y cartón" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PlantCreate: {
        type: "object",
        required: ["name", "municipality"],
        description: "El nombre de la planta es único.",
        properties: {
          name: { type: "string", maxLength: 150, example: "Planta de Clasificación Riohacha" },
          municipality: { type: "string", maxLength: 80, example: "Riohacha" },
          address: { type: "string", maxLength: 255, nullable: true, example: "Calle 15 # 10-20, Riohacha" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      PlantPatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de PlantCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          municipality: { type: "string", maxLength: 80 },
          address: { type: "string", maxLength: 255, nullable: true },
          description: { type: "string", maxLength: 255, nullable: true, example: "Opera de lunes a sábado" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
