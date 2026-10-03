import { entityResponse, errorRef, idParam, jsonBody, listResponse, messageResponse } from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "MaterialRates";
const id = idParam("Id de la tarifa");

// Write responses also report how many previous active rates of the material were closed.
const writeResponse = (description: string) =>
  entityResponse(description, "materialRate", "MaterialRate", {
    previousRatesClosed: {
      type: "integer",
      example: 1,
      description: "Tarifas activas anteriores del mismo material que pasaron a inactive",
    },
  });

export const materialRatesSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Historial de tarifas por kilo de cada material (Material 1:N MaterialRate)" }],
  paths: {
    "/api/material-rates": {
      get: {
        tags: [TAG],
        summary: "Listar tarifas vigentes",
        description: "Solo tarifas activas (una por material). Con ?materialId= devuelve la tarifa vigente de ese material.",
        parameters: [
          {
            name: "materialId",
            in: "query",
            required: false,
            description: "Solo la tarifa de este material",
            schema: { type: "integer", minimum: 1, example: 1 },
          },
        ],
        responses: {
          "200": listResponse("Lista de tarifas vigentes", "materialRates", "MaterialRate"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear una tarifa",
        description:
          "El material debe existir y estar activo. Si la tarifa queda activa, la tarifa activa anterior del material pasa a inactive.",
        requestBody: jsonBody("MaterialRateCreate"),
        responses: {
          "201": writeResponse("Tarifa creada"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/material-rates/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener una tarifa por id",
        description: "Incluye tarifas históricas (inactive).",
        parameters: [id],
        responses: {
          "200": entityResponse("Tarifa encontrada", "materialRate", "MaterialRate"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar una tarifa",
        description: "description omitida queda en null y validFrom omitida toma la fecha de hoy.",
        parameters: [id],
        requestBody: jsonBody("MaterialRateCreate"),
        responses: {
          "200": writeResponse("Tarifa actualizada"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente una tarifa",
        description: "Enviar status active reactiva la tarifa y cierra la vigente del material.",
        parameters: [id],
        requestBody: jsonBody("MaterialRatePatch"),
        responses: {
          "200": writeResponse("Tarifa actualizada"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente una tarifa",
        parameters: [id],
        responses: {
          "200": messageResponse("Tarifa eliminada", "Tarifa eliminada", { id: { type: "integer", example: 1 } }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/material-rates/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de una tarifa",
        description: "Cambia status a inactive; el material puede quedar sin tarifa vigente.",
        parameters: [id],
        responses: {
          "200": messageResponse("Tarifa desactivada", "Tarifa desactivada", {
            materialRate: { $ref: "#/components/schemas/MaterialRate" },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
  },
  components: {
    schemas: {
      MaterialRate: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Tarifa Cartón 2026-10" },
          description: { type: "string", nullable: true, example: "Tarifa vigente de compra por kilo" },
          pricePerKg: { type: "number", format: "double", example: 420, description: "COP por kilo (2 decimales)" },
          validFrom: { type: "string", format: "date", example: "2026-10-01" },
          materialId: { type: "integer", example: 3 },
          material: {
            type: "object",
            nullable: true,
            properties: { id: { type: "integer", example: 3 }, name: { type: "string", example: "Cartón" } },
          },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MaterialRateCreate: {
        type: "object",
        required: ["name", "materialId", "pricePerKg"],
        description: "Una tarifa por material y fecha de inicio.",
        properties: {
          name: { type: "string", maxLength: 150, example: "Tarifa Cartón 2026-10" },
          materialId: { type: "integer", minimum: 1, example: 3 },
          pricePerKg: { type: "number", exclusiveMinimum: true, minimum: 0, maximum: 99999999.99, example: 420 },
          validFrom: { type: "string", format: "date", example: "2026-10-01", description: "YYYY-MM-DD, no futura; por defecto hoy" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      MaterialRatePatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de MaterialRateCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          materialId: { type: "integer", minimum: 1 },
          pricePerKg: { type: "number", exclusiveMinimum: true, minimum: 0, maximum: 99999999.99, example: 450 },
          validFrom: { type: "string", format: "date" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
