import { entityResponse, errorRef, idParam, jsonBody, listResponse, messageResponse } from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Weighings";
const id = idParam("Id del pesaje");
const idFilter = (name: string, description: string) => ({
  name,
  in: "query",
  required: false,
  description,
  schema: { type: "integer", minimum: 1, example: 1 },
});
const stockNote = "Ajusta las existencias del lote en la misma transacción; responde 409 si el lote quedaría en negativo.";

export const weighingsSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Pesajes en balanza (bruto, tara, neto) que alimentan las existencias de los lotes" }],
  paths: {
    "/api/weighings": {
      get: {
        tags: [TAG],
        summary: "Listar pesajes activos",
        description: "Más recientes primero; incluye jornada, material y lote (con sus existencias actuales).",
        parameters: [
          idFilter("collectionId", "Solo pesajes de esta jornada"),
          idFilter("materialId", "Solo pesajes de este material"),
          idFilter("materialLotId", "Solo pesajes de este lote"),
        ],
        responses: {
          "200": listResponse("Lista de pesajes activos", "weighings", "Weighing"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Registrar un pesaje",
        description: `netWeightKg = grossWeightKg − tareWeightKg (lo calcula el servidor). Si se indica lote, debe ser del mismo material y su existencia sube en el neto. ${stockNote}`,
        requestBody: jsonBody("WeighingCreate"),
        responses: {
          "201": entityResponse("Pesaje registrado", "weighing", "Weighing"),
          "400": errorRef("BadRequest"),
        },
      },
    },
    "/api/weighings/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener un pesaje por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Pesaje encontrado", "weighing", "Weighing"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar un pesaje",
        description: `Recalcula el neto y traslada el efecto sobre los lotes (lote anterior − neto anterior, lote nuevo + neto nuevo). ${stockNote}`,
        parameters: [id],
        requestBody: jsonBody("WeighingCreate"),
        responses: {
          "200": entityResponse("Pesaje actualizado", "weighing", "Weighing"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente un pesaje",
        description: `Enviar status active reactiva un pesaje anulado y vuelve a sumar su neto al lote. ${stockNote}`,
        parameters: [id],
        requestBody: jsonBody("WeighingPatch"),
        responses: {
          "200": entityResponse("Pesaje actualizado", "weighing", "Weighing"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente un pesaje",
        description: `Descuenta su neto del lote. ${stockNote}`,
        parameters: [id],
        responses: {
          "200": messageResponse("Pesaje eliminado", "Pesaje eliminado; se descontó su peso neto del lote", {
            id: { type: "integer", example: 1 },
          }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/weighings/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Anular un pesaje (baja lógica)",
        description: `Cambia status a inactive y descuenta su neto del lote. ${stockNote}`,
        parameters: [id],
        responses: {
          "200": messageResponse("Pesaje anulado", "Pesaje anulado; se descontó su peso neto del lote", {
            weighing: { $ref: "#/components/schemas/Weighing" },
          }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
  },
  components: {
    schemas: {
      Weighing: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Pesaje Cartón 2026-10-01" },
          description: { type: "string", nullable: true, example: "Ingreso al lote LT-MAI-CAR-202610-002" },
          grossWeightKg: { type: "number", example: 120.5 },
          tareWeightKg: { type: "number", example: 2.5 },
          netWeightKg: { type: "number", example: 118, description: "Calculado: bruto − tara" },
          collectionId: { type: "integer", example: 1 },
          collection: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Jornada Ruta Centro 2026-10-01" },
              collectionDate: { type: "string", format: "date", example: "2026-10-01" },
            },
          },
          materialId: { type: "integer", example: 4 },
          material: {
            type: "object",
            nullable: true,
            properties: { id: { type: "integer", example: 4 }, name: { type: "string", example: "Cartón" } },
          },
          materialLotId: { type: "integer", nullable: true, example: 5 },
          materialLot: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 5 },
              name: { type: "string", example: "LT-MAI-CAR-202610-002" },
              weightKg: { type: "number", example: 1357.73, description: "Existencias del lote tras la operación" },
            },
          },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WeighingCreate: {
        type: "object",
        required: ["name", "collectionId", "materialId", "grossWeightKg"],
        description: "No incluye netWeightKg (lo calcula el servidor). La tara debe ser menor que el bruto.",
        properties: {
          name: { type: "string", maxLength: 150, example: "Pesaje Cartón 2026-10-01" },
          collectionId: { type: "integer", minimum: 1, example: 1 },
          materialId: { type: "integer", minimum: 1, example: 4 },
          materialLotId: { type: "integer", minimum: 1, nullable: true, example: 5 },
          grossWeightKg: { type: "number", exclusiveMinimum: true, minimum: 0, example: 120.5 },
          tareWeightKg: { type: "number", minimum: 0, default: 0, example: 2.5 },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      WeighingPatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de WeighingCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          collectionId: { type: "integer", minimum: 1 },
          materialId: { type: "integer", minimum: 1 },
          materialLotId: { type: "integer", minimum: 1, nullable: true },
          grossWeightKg: { type: "number", exclusiveMinimum: true, minimum: 0, example: 125 },
          tareWeightKg: { type: "number", minimum: 0 },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
