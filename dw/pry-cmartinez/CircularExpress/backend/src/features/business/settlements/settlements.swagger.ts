import { entityResponse, errorRef, idParam, jsonBody, listResponse, messageResponse } from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Settlements";
const id = idParam("Id de la liquidación");
const states = ["pending", "approved", "paid", "rejected"];

export const settlementsSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Liquidaciones de pago a recicladores calculadas desde sus pesajes (Recycler 1:N Settlement)" }],
  paths: {
    "/api/settlements": {
      get: {
        tags: [TAG],
        summary: "Listar liquidaciones activas",
        description: "Más recientes primero; filtros opcionales por reciclador y estado.",
        parameters: [
          { name: "recyclerId", in: "query", required: false, schema: { type: "integer", minimum: 1, example: 1 } },
          { name: "state", in: "query", required: false, schema: { type: "string", enum: states } },
        ],
        responses: {
          "200": listResponse("Lista de liquidaciones activas", "settlements", "Settlement"),
          "400": errorRef("BadRequest"),
        },
      },
      post: {
        tags: [TAG],
        summary: "Emitir una liquidación",
        description:
          "Calcula el monto: Σ pesajes activos de las jornadas del reciclador en el período × tarifa vigente en la fecha de cada jornada. " +
          "Inicia en pending; responde con el desglose por material. 409 si el reciclador ya tiene una liquidación vigente que se cruza con el período.",
        requestBody: jsonBody("SettlementCreate"),
        responses: {
          "201": entityResponse("Liquidación emitida", "settlement", "Settlement"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/settlements/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener una liquidación por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Liquidación encontrada", "settlement", "Settlement"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar y recalcular una liquidación pendiente",
        description: "Solo en estado pending (409 en otro caso); siempre recalcula los totales.",
        parameters: [id],
        requestBody: jsonBody("SettlementCreate"),
        responses: {
          "200": entityResponse("Liquidación recalculada", "settlement", "Settlement"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente o cambiar de estado",
        description:
          "Transiciones: pending → approved | rejected, approved → paid | rejected (paid y rejected son finales; otra → 409). " +
          "observations se puede editar siempre; reciclador, período, referencia y fecha solo en pending (recalcula).",
        parameters: [id],
        requestBody: jsonBody("SettlementPatch"),
        responses: {
          "200": entityResponse("Liquidación actualizada", "settlement", "Settlement"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente una liquidación",
        description: "Solo pending o rejected; 409 si está aprobada o pagada.",
        parameters: [id],
        responses: {
          "200": messageResponse("Liquidación eliminada", "Liquidación eliminada", { id: { type: "integer", example: 1 } }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/settlements/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Anular una liquidación (baja lógica)",
        description: "Solo pending o rejected; 409 si está aprobada o pagada.",
        parameters: [id],
        responses: {
          "200": messageResponse("Liquidación anulada", "Liquidación anulada", {
            settlement: { $ref: "#/components/schemas/Settlement" },
          }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
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
          referenceCode: { type: "string", example: "LIQ-202610-1-001" },
          settlementDate: { type: "string", format: "date", example: "2026-10-03" },
          periodStart: { type: "string", format: "date", example: "2026-08-04" },
          periodEnd: { type: "string", format: "date", example: "2026-10-03" },
          totalWeightKg: { type: "number", example: 412.5 },
          weighingsCount: { type: "integer", example: 4 },
          amount: { type: "number", example: 512300, description: "COP; calculado desde los pesajes y las tarifas" },
          state: { type: "string", enum: states, example: "pending" },
          observations: { type: "string", nullable: true, example: "Liquidación de los últimos 60 días" },
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
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          breakdown: {
            type: "array",
            description: "Solo cuando los totales se acaban de calcular (POST, PUT o PATCH que recalcula)",
            items: {
              type: "object",
              properties: {
                materialId: { type: "integer", example: 4 },
                materialName: { type: "string", example: "Cartón" },
                weighingsCount: { type: "integer", example: 2 },
                netWeightKg: { type: "number", example: 230.5 },
                amount: { type: "number", example: 92200 },
                unpricedWeighings: { type: "integer", example: 0, description: "Pesajes anteriores a la primera tarifa del material" },
              },
            },
          },
        },
      },
      SettlementCreate: {
        type: "object",
        required: ["recyclerId", "periodStart", "periodEnd"],
        description: "No incluye amount, totalWeightKg, weighingsCount ni state (calculados / flujo).",
        properties: {
          recyclerId: { type: "integer", minimum: 1, example: 1 },
          periodStart: { type: "string", format: "date", example: "2026-08-04" },
          periodEnd: { type: "string", format: "date", example: "2026-10-03", description: "No futura" },
          referenceCode: { type: "string", maxLength: 40, description: "Se genera si se omite (LIQ-AAAAMM-<reciclador>-NNN)" },
          settlementDate: { type: "string", format: "date", description: "Por defecto hoy" },
          observations: { type: "string", maxLength: 255, nullable: true },
        },
      },
      SettlementPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          state: { type: "string", enum: states, example: "approved" },
          observations: { type: "string", maxLength: 255, nullable: true },
          recyclerId: { type: "integer", minimum: 1 },
          periodStart: { type: "string", format: "date" },
          periodEnd: { type: "string", format: "date" },
          referenceCode: { type: "string", maxLength: 40 },
          settlementDate: { type: "string", format: "date" },
        },
      },
    },
  },
};
