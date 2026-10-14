/**
 * OpenAPI docs for the settlements feature.
 * Aggregated by `src/swagger` (external registry); nothing is mounted here.
 *
 * Access mode: JWT + RBAC on every endpoint (bearerAuth, 401 and 403 are applied by src/swagger).
 */

const TAG = "Liquidaciones";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico de la liquidación (> 0). Si no lo es, la API responde 400.",
  schema: { type: "integer", minimum: 1 },
};

const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});

const errorResponse = (description: string) =>
  jsonResponse(description, "#/components/schemas/ErrorResponse");

const DETAIL = "#/components/schemas/SettlementDetail";

export const settlementsSwagger = {
  tags: [
    {
      name: TAG,
      description:
        "Liquidación verificable de una recolección: congela totales y referencias de tarifa; anular reabre la recolección — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/settlements": {
      get: {
        tags: [TAG],
        summary: "Listar liquidaciones emitidas",
        responses: {
          "200": {
            description: "Liquidaciones emitidas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { settlements: { type: "array", items: { $ref: "#/components/schemas/Settlement" } } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: [TAG],
        summary: "Liquidar una recolección (transaccional)",
        description:
          "Confirma la tarifa vigente de cada pesaje en la fecha de la recolección (re-tarifica si cambió), " +
          "calcula totales y bloquea la recolección.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SettlementInput" } } },
        },
        responses: {
          "201": jsonResponse("Liquidación emitida", DETAIL),
          "400": errorResponse("Datos inválidos o recolección sin pesajes activos"),
          "404": errorResponse("Recolección no encontrada/inactiva o material sin tarifa vigente"),
          "409": errorResponse("La recolección ya está liquidada"),
        },
      },
    },
    "/api/settlements/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener liquidación emitida con su recolección y pesajes",
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Liquidación", DETAIL),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrada o anulada"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Actualizar notas (PUT)",
        description: "Los valores liquidados nunca cambian.",
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SettlementNotes" } } },
        },
        responses: {
          "200": jsonResponse("Actualizada", DETAIL),
          "400": errorResponse("Sin notes"),
          "404": errorResponse("No encontrada o anulada"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar notas (PATCH)",
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SettlementNotes" } } },
        },
        responses: {
          "200": jsonResponse("Actualizada", DETAIL),
          "400": errorResponse("Sin notes"),
          "404": errorResponse("No encontrada o anulada"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar liquidación (físico)",
        description: "Solo anuladas; una emitida es un registro de pago (409).",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Eliminada",
            content: {
              "application/json": {
                schema: { type: "object", properties: { message: { type: "string", example: "Liquidación eliminada" } } },
              },
            },
          },
          "404": errorResponse("No encontrada"),
          "409": errorResponse("Está emitida: anúlala primero"),
        },
      },
    },
    "/api/settlements/{id}/void": {
      patch: {
        tags: [TAG],
        summary: "Anular liquidación (lógico)",
        description: "Status = voided; la recolección queda abierta para corregir y volver a liquidar.",
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Anulada", "#/components/schemas/Settlement"),
          "404": errorResponse("No encontrada o ya anulada"),
        },
      },
    },
    "/api/settlements/{id}/verify": {
      get: {
        tags: [TAG],
        summary: "Verificar liquidación",
        description:
          "Recalcula neto e importe de cada pesaje, comprueba que la tarifa referenciada corresponda al " +
          "material, al precio y a la fecha de la recolección, y compara los totales con los guardados.",
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Resultado de la verificación", "#/components/schemas/SettlementVerification"),
          "404": errorResponse("No encontrada"),
        },
      },
    },
  },
  components: {
    schemas: {
      Settlement: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          collectionId: { type: "integer", example: 1 },
          recyclerId: { type: "integer", example: 1 },
          settledAt: { type: "string", format: "date-time" },
          totalNetKg: { type: "number", example: 88 },
          totalAmount: { type: "number", example: 124890 },
          lineCount: { type: "integer", example: 3 },
          status: { type: "string", enum: ["issued", "voided"], example: "issued" },
          notes: { type: "string", nullable: true, example: "Pago en efectivo" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SettlementDetail: {
        allOf: [
          { $ref: "#/components/schemas/Settlement" },
          { type: "object", properties: { collection: { $ref: "#/components/schemas/CollectionWithWeighings" } } },
        ],
      },
      SettlementInput: {
        type: "object",
        required: ["collectionId"],
        properties: {
          collectionId: { type: "integer", minimum: 1 },
          notes: { type: "string", maxLength: 255, nullable: true },
        },
      },
      SettlementNotes: {
        type: "object",
        required: ["notes"],
        properties: { notes: { type: "string", maxLength: 255, nullable: true } },
      },
      SettlementVerification: {
        type: "object",
        properties: {
          settlementId: { type: "integer" },
          status: { type: "string", enum: ["issued", "voided"] },
          collectionId: { type: "integer" },
          collectedOn: { type: "string", format: "date" },
          consistent: { type: "boolean", description: "true si todo coincide" },
          stored: { $ref: "#/components/schemas/SettlementTotals" },
          recomputed: { $ref: "#/components/schemas/SettlementTotals" },
          lines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                weighingId: { type: "integer" },
                materialId: { type: "integer" },
                grossKg: { type: "number" },
                tareKg: { type: "number" },
                netKg: { type: "number" },
                pricePerKg: { type: "number" },
                amount: { type: "number" },
                rateId: { type: "integer" },
                rateValidFrom: { type: "string", format: "date", nullable: true },
                rateValidTo: { type: "string", format: "date", nullable: true },
                netOk: { type: "boolean" },
                amountOk: { type: "boolean" },
                rateOk: { type: "boolean" },
              },
            },
          },
        },
      },
      SettlementTotals: {
        type: "object",
        properties: {
          totalNetKg: { type: "number" },
          totalAmount: { type: "number" },
          lineCount: { type: "integer" },
        },
      },
    },
  },
};
