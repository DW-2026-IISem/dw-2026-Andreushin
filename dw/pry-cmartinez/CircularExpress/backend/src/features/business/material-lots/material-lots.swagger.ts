import { entityResponse, errorRef, idParam, jsonBody, listResponse, messageResponse } from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "MaterialLots";
const id = idParam("Id del lote");
const idFilter = (name: string, description: string) => ({
  name,
  in: "query",
  required: false,
  description,
  schema: { type: "integer", minimum: 1, example: 1 },
});

export const materialLotsSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Lotes de material inventariados en planta (Plant 1:N, Material 1:N)" }],
  paths: {
    "/api/material-lots": {
      get: {
        tags: [TAG],
        summary: "Listar lotes activos",
        description: "Incluye planta, material y existencias (weightKg). Filtros opcionales por planta y material.",
        parameters: [idFilter("plantId", "Solo lotes de esta planta"), idFilter("materialId", "Solo lotes de este material")],
        responses: {
          "200": listResponse("Lista de lotes activos", "materialLots", "MaterialLot"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear un lote",
        description: "Planta y material deben existir y estar activos. weightKg fija las existencias iniciales (por defecto 0).",
        requestBody: jsonBody("MaterialLotCreate"),
        responses: {
          "201": entityResponse("Lote creado", "materialLot", "MaterialLot"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/material-lots/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener un lote por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Lote encontrado", "materialLot", "MaterialLot"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar un lote",
        description: "No acepta weightKg. Un lote con existencias no puede cambiar de planta ni de material (409).",
        parameters: [id],
        requestBody: jsonBody("MaterialLotUpdate"),
        responses: {
          "200": entityResponse("Lote actualizado", "materialLot", "MaterialLot"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente un lote",
        description: "No acepta weightKg. Un lote con existencias no puede cambiar de planta ni de material (409).",
        parameters: [id],
        requestBody: jsonBody("MaterialLotPatch"),
        responses: {
          "200": entityResponse("Lote actualizado", "materialLot", "MaterialLot"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente un lote",
        description: "Responde 409 si el lote ya está referenciado por pesajes o ventas.",
        parameters: [id],
        responses: {
          "200": messageResponse("Lote eliminado", "Lote eliminado", { id: { type: "integer", example: 1 } }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/material-lots/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de un lote",
        description: "Cambia status a inactive; el lote deja de aparecer en el listado.",
        parameters: [id],
        responses: {
          "200": messageResponse("Lote desactivado", "Lote desactivado", {
            materialLot: { $ref: "#/components/schemas/MaterialLot" },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
  },
  components: {
    schemas: {
      MaterialLot: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "LT-RIO-PET-202610-001", description: "Código único del lote" },
          description: { type: "string", nullable: true, example: "Plástico PET clasificado en Planta de Clasificación Riohacha" },
          weightKg: { type: "number", format: "double", example: 850.5, description: "Existencias actuales en kg" },
          plantId: { type: "integer", example: 1 },
          plant: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Planta de Clasificación Riohacha" },
              municipality: { type: "string", example: "Riohacha" },
            },
          },
          materialId: { type: "integer", example: 2 },
          material: {
            type: "object",
            nullable: true,
            properties: { id: { type: "integer", example: 2 }, name: { type: "string", example: "Plástico PET" } },
          },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MaterialLotCreate: {
        type: "object",
        required: ["name", "plantId", "materialId"],
        properties: {
          name: { type: "string", maxLength: 60, example: "LT-RIO-PET-202610-001" },
          plantId: { type: "integer", minimum: 1, example: 1 },
          materialId: { type: "integer", minimum: 1, example: 2 },
          weightKg: { type: "number", minimum: 0, default: 0, example: 0, description: "Existencias iniciales" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      MaterialLotUpdate: {
        type: "object",
        required: ["name", "plantId", "materialId"],
        description: "Igual que MaterialLotCreate pero sin weightKg.",
        properties: {
          name: { type: "string", maxLength: 60, example: "LT-RIO-PET-202610-001" },
          plantId: { type: "integer", minimum: 1, example: 1 },
          materialId: { type: "integer", minimum: 1, example: 2 },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
      MaterialLotPatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de MaterialLotUpdate.",
        properties: {
          name: { type: "string", maxLength: 60 },
          plantId: { type: "integer", minimum: 1 },
          materialId: { type: "integer", minimum: 1 },
          description: { type: "string", maxLength: 255, nullable: true, example: "Compactado en pacas de 50 kg" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
