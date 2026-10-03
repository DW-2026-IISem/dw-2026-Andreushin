import { entityResponse, errorRef, idParam, jsonBody, listResponse, messageResponse } from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "MaterialSales";
const id = idParam("Id de la venta");
const stockNote = "Ajusta las existencias del lote en la misma transacción; responde 409 si el lote no tiene existencias suficientes.";

export const materialSalesSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Ventas de material de los lotes a clientes transformadores (MaterialLot 1:N MaterialSale)" }],
  paths: {
    "/api/material-sales": {
      get: {
        tags: [TAG],
        summary: "Listar ventas activas",
        description: "Más recientes primero; incluye el lote (con sus existencias actuales) y su material.",
        parameters: [
          {
            name: "materialLotId",
            in: "query",
            required: false,
            description: "Solo ventas de este lote",
            schema: { type: "integer", minimum: 1, example: 1 },
          },
        ],
        responses: {
          "200": listResponse("Lista de ventas activas", "materialSales", "MaterialSale"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Registrar una venta",
        description: `totalAmount = quantityKg × unitPricePerKg (lo calcula el servidor). Descuenta quantityKg del lote. ${stockNote}`,
        requestBody: jsonBody("MaterialSaleCreate"),
        responses: {
          "201": entityResponse("Venta registrada", "materialSale", "MaterialSale"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/material-sales/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener una venta por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Venta encontrada", "materialSale", "MaterialSale"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar una venta",
        description: `Recalcula el total y traslada el efecto sobre los lotes. ${stockNote}`,
        parameters: [id],
        requestBody: jsonBody("MaterialSaleCreate"),
        responses: {
          "200": entityResponse("Venta actualizada", "materialSale", "MaterialSale"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente una venta",
        description: `Enviar status active reactiva una venta anulada y vuelve a descontar del lote. ${stockNote}`,
        parameters: [id],
        requestBody: jsonBody("MaterialSalePatch"),
        responses: {
          "200": entityResponse("Venta actualizada", "materialSale", "MaterialSale"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente una venta",
        description: "Devuelve la cantidad a las existencias del lote.",
        parameters: [id],
        responses: {
          "200": messageResponse("Venta eliminada", "Venta eliminada; la cantidad volvió a las existencias del lote", {
            id: { type: "integer", example: 1 },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
    "/api/material-sales/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Anular una venta (baja lógica)",
        description: "Cambia status a inactive y devuelve la cantidad a las existencias del lote.",
        parameters: [id],
        responses: {
          "200": messageResponse("Venta anulada", "Venta anulada; la cantidad volvió a las existencias del lote", {
            materialSale: { $ref: "#/components/schemas/MaterialSale" },
          }),
          "404": errorRef("NotFound"),
        },
      },
    },
  },
  components: {
    schemas: {
      MaterialSale: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Venta Cartón 2026-10-01" },
          description: { type: "string", nullable: true, example: "Despacho desde el lote LT-MAI-CAR-202610-002" },
          buyerName: { type: "string", example: "Papeles Reciclados de la Costa S.A.S." },
          saleDate: { type: "string", format: "date", example: "2026-10-01" },
          quantityKg: { type: "number", example: 250 },
          unitPricePerKg: { type: "number", example: 560 },
          totalAmount: { type: "number", example: 140000, description: "Calculado: quantityKg × unitPricePerKg (COP)" },
          materialLotId: { type: "integer", example: 5 },
          materialLot: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 5 },
              name: { type: "string", example: "LT-MAI-CAR-202610-002" },
              weightKg: { type: "number", example: 989.73, description: "Existencias del lote tras la operación" },
              material: {
                type: "object",
                nullable: true,
                properties: { id: { type: "integer", example: 4 }, name: { type: "string", example: "Cartón" } },
              },
            },
          },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MaterialSaleCreate: {
        type: "object",
        required: ["name", "buyerName", "materialLotId", "quantityKg", "unitPricePerKg"],
        description: "No incluye totalAmount (lo calcula el servidor).",
        properties: {
          name: { type: "string", maxLength: 150, example: "Venta Cartón 2026-10-01" },
          buyerName: { type: "string", maxLength: 150, example: "Papeles Reciclados de la Costa S.A.S." },
          materialLotId: { type: "integer", minimum: 1, example: 5 },
          quantityKg: { type: "number", exclusiveMinimum: true, minimum: 0, example: 250 },
          unitPricePerKg: { type: "number", exclusiveMinimum: true, minimum: 0, example: 560 },
          saleDate: { type: "string", format: "date", example: "2026-10-01", description: "YYYY-MM-DD, no futura; por defecto hoy" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      MaterialSalePatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de MaterialSaleCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          buyerName: { type: "string", maxLength: 150 },
          materialLotId: { type: "integer", minimum: 1 },
          quantityKg: { type: "number", exclusiveMinimum: true, minimum: 0, example: 300 },
          unitPricePerKg: { type: "number", exclusiveMinimum: true, minimum: 0 },
          saleDate: { type: "string", format: "date" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
