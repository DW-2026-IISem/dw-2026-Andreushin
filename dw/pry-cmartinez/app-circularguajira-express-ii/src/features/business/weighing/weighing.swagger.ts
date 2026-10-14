/**
 * OpenAPI docs for the weighing feature (collections + weighings).
 * Aggregated by `src/swagger` (external registry); nothing is mounted here.
 *
 * Access mode: JWT + RBAC on every endpoint (bearerAuth, 401 and 403 are applied by src/swagger).
 */

const COLLECTIONS_TAG = "Recolecciones";
const WEIGHINGS_TAG = "Pesajes";

const idParameter = (what: string) => ({
  name: "id",
  in: "path",
  required: true,
  description: `Id numérico ${what} (> 0). Si no lo es, la API responde 400.`,
  schema: { type: "integer", minimum: 1 },
});

const jsonBody = (ref: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: ref } } },
});

const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});

const listResponse = (description: string, key: string, ref: string) => ({
  description,
  content: {
    "application/json": {
      schema: { type: "object", properties: { [key]: { type: "array", items: { $ref: ref } } } },
    },
  },
});

const messageResponse = (example: string) => ({
  description: "Eliminado",
  content: {
    "application/json": {
      schema: { type: "object", properties: { message: { type: "string", example } } },
    },
  },
});

const errorResponse = (description: string) =>
  jsonResponse(description, "#/components/schemas/ErrorResponse");

const COLLECTION = "#/components/schemas/CollectionWithWeighings";
const WEIGHING = "#/components/schemas/Weighing";
const SETTLED = "La recolección está liquidada (anula la liquidación para modificarla)";

export const weighingSwagger = {
  tags: [
    {
      name: COLLECTIONS_TAG,
      description:
        "Entrega de un reciclador en una ruta, con sus pesajes; totales derivados. Escrituras transaccionales — **JWT + RBAC**",
    },
    {
      name: WEIGHINGS_TAG,
      description:
        "Pesaje por material: neto = bruto − tara; importe = neto × tarifa vigente en la fecha de la recolección — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/collections": {
      get: {
        tags: [COLLECTIONS_TAG],
        summary: "Listar recolecciones activas con sus pesajes",
        description: "La más reciente primero.",
        responses: { "200": listResponse("Recolecciones activas", "collections", COLLECTION) },
      },
      post: {
        tags: [COLLECTIONS_TAG],
        summary: "Registrar recolección con sus pesajes (transaccional)",
        description:
          "Reciclador y ruta activos; cada pesaje toma la tarifa vigente en collectedOn. " +
          "Si un pesaje falla, no se guarda nada.",
        requestBody: jsonBody("#/components/schemas/CollectionInput"),
        responses: {
          "201": jsonResponse("Recolección registrada", COLLECTION),
          "400": errorResponse("Datos inválidos, bruto <= tara, fecha futura o reciclador/ruta/material inactivo"),
          "404": errorResponse("Reciclador, ruta o material no encontrado, o sin tarifa vigente en la fecha"),
        },
      },
    },
    "/api/collections/{id}": {
      get: {
        tags: [COLLECTIONS_TAG],
        summary: "Obtener recolección activa con sus pesajes",
        parameters: [idParameter("de la recolección")],
        responses: {
          "200": jsonResponse("Recolección", COLLECTION),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrada o inactiva"),
        },
      },
      put: {
        tags: [COLLECTIONS_TAG],
        summary: "Actualizar cabecera (PUT)",
        description: "Si cambia la fecha, todos los pesajes se re-tarifican en la misma transacción.",
        parameters: [idParameter("de la recolección")],
        requestBody: jsonBody("#/components/schemas/CollectionUpdate"),
        responses: {
          "200": jsonResponse("Actualizada", COLLECTION),
          "400": errorResponse("Datos inválidos o referencia inactiva"),
          "404": errorResponse("No encontrada, referencia inexistente o sin tarifa en la nueva fecha"),
          "409": errorResponse(SETTLED),
        },
      },
      patch: {
        tags: [COLLECTIONS_TAG],
        summary: "Actualizar cabecera (PATCH)",
        description: "Solo lo enviado; un cambio de fecha re-tarifica los pesajes.",
        parameters: [idParameter("de la recolección")],
        requestBody: jsonBody("#/components/schemas/CollectionPatch"),
        responses: {
          "200": jsonResponse("Actualizada", COLLECTION),
          "400": errorResponse("Cuerpo vacío, dato inválido o referencia inactiva"),
          "404": errorResponse("No encontrada, referencia inexistente o sin tarifa en la nueva fecha"),
          "409": errorResponse(SETTLED),
        },
      },
      delete: {
        tags: [COLLECTIONS_TAG],
        summary: "Eliminar recolección (físico)",
        description: "Borra pesajes y cabecera; 409 si tiene liquidaciones (emitidas o anuladas).",
        parameters: [idParameter("de la recolección")],
        responses: {
          "200": messageResponse("Recolección eliminada"),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrada"),
          "409": errorResponse("Tiene liquidaciones registradas"),
        },
      },
    },
    "/api/collections/{id}/deactivate": {
      patch: {
        tags: [COLLECTIONS_TAG],
        summary: "Eliminar recolección (lógico)",
        description: "Recolección y pesajes inactivos.",
        parameters: [idParameter("de la recolección")],
        responses: {
          "200": jsonResponse("Desactivada", "#/components/schemas/Collection"),
          "404": errorResponse("No encontrada o inactiva"),
          "409": errorResponse(SETTLED),
        },
      },
    },
    "/api/weighings": {
      get: {
        tags: [WEIGHINGS_TAG],
        summary: "Listar pesajes activos",
        responses: { "200": listResponse("Pesajes activos", "weighings", WEIGHING) },
      },
      post: {
        tags: [WEIGHINGS_TAG],
        summary: "Agregar pesaje a una recolección abierta",
        description: "Recalcula los totales de la recolección en la misma transacción.",
        requestBody: jsonBody("#/components/schemas/WeighingInput"),
        responses: {
          "201": jsonResponse("Pesaje registrado", WEIGHING),
          "400": errorResponse("Datos inválidos, bruto <= tara o material inactivo"),
          "404": errorResponse("Recolección o material no encontrado, o sin tarifa vigente"),
          "409": errorResponse(SETTLED),
        },
      },
    },
    "/api/weighings/{id}": {
      get: {
        tags: [WEIGHINGS_TAG],
        summary: "Obtener pesaje activo",
        parameters: [idParameter("del pesaje")],
        responses: {
          "200": jsonResponse("Pesaje", WEIGHING),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
      put: {
        tags: [WEIGHINGS_TAG],
        summary: "Actualizar pesos (PUT)",
        description: "Recolección y material no cambian; recalcula neto, importe y totales.",
        parameters: [idParameter("del pesaje")],
        requestBody: jsonBody("#/components/schemas/WeighingUpdate"),
        responses: {
          "200": jsonResponse("Actualizado", WEIGHING),
          "400": errorResponse("Pesos inválidos o bruto <= tara"),
          "404": errorResponse("No encontrado"),
          "409": errorResponse(SETTLED),
        },
      },
      patch: {
        tags: [WEIGHINGS_TAG],
        summary: "Actualizar pesos (PATCH)",
        parameters: [idParameter("del pesaje")],
        requestBody: jsonBody("#/components/schemas/WeighingPatch"),
        responses: {
          "200": jsonResponse("Actualizado", WEIGHING),
          "400": errorResponse("Cuerpo vacío, peso inválido o bruto <= tara"),
          "404": errorResponse("No encontrado"),
          "409": errorResponse(SETTLED),
        },
      },
      delete: {
        tags: [WEIGHINGS_TAG],
        summary: "Eliminar pesaje (físico)",
        parameters: [idParameter("del pesaje")],
        responses: {
          "200": messageResponse("Pesaje eliminado"),
          "404": errorResponse("No encontrado"),
          "409": errorResponse(SETTLED),
        },
      },
    },
    "/api/weighings/{id}/deactivate": {
      patch: {
        tags: [WEIGHINGS_TAG],
        summary: "Eliminar pesaje (lógico)",
        description: "Deja de contar en los totales de la recolección.",
        parameters: [idParameter("del pesaje")],
        responses: {
          "200": jsonResponse("Desactivado", WEIGHING),
          "404": errorResponse("No encontrado o inactivo"),
          "409": errorResponse(SETTLED),
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
          collectionId: { type: "integer", example: 1 },
          materialId: { type: "integer", example: 1 },
          rateId: { type: "integer", description: "Tarifa aplicada (referencia)", example: 2 },
          pricePerKg: { type: "number", description: "Precio aplicado (copia)", example: 1200 },
          grossKg: { type: "number", example: 50.5 },
          tareKg: { type: "number", example: 2 },
          netKg: { type: "number", description: "grossKg − tareKg", example: 48.5 },
          amount: { type: "number", description: "netKg × pricePerKg", example: 58200 },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Collection: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          recyclerId: { type: "integer", example: 1 },
          routeId: { type: "integer", example: 1 },
          collectedOn: { type: "string", format: "date", example: "2026-10-10" },
          totalNetKg: { type: "number", description: "Suma de netKg de los pesajes activos", example: 77 },
          totalAmount: { type: "number", description: "Suma de amount de los pesajes activos", example: 71310 },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CollectionWithWeighings: {
        allOf: [
          { $ref: "#/components/schemas/Collection" },
          { type: "object", properties: { weighings: { type: "array", items: { $ref: WEIGHING } } } },
        ],
      },
      WeighingLine: {
        type: "object",
        required: ["materialId", "grossKg"],
        properties: {
          materialId: { type: "integer", minimum: 1 },
          grossKg: { type: "number", minimum: 0.01, maximum: 100000 },
          tareKg: { type: "number", minimum: 0, default: 0 },
        },
      },
      CollectionInput: {
        type: "object",
        required: ["recyclerId", "routeId", "weighings"],
        properties: {
          recyclerId: { type: "integer", minimum: 1 },
          routeId: { type: "integer", minimum: 1 },
          collectedOn: { type: "string", format: "date", description: "Por defecto hoy; no futura" },
          weighings: {
            type: "array",
            minItems: 1,
            maxItems: 50,
            items: { $ref: "#/components/schemas/WeighingLine" },
          },
        },
      },
      CollectionUpdate: {
        type: "object",
        required: ["recyclerId", "routeId"],
        properties: {
          recyclerId: { type: "integer", minimum: 1 },
          routeId: { type: "integer", minimum: 1 },
          collectedOn: { type: "string", format: "date" },
        },
      },
      CollectionPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          recyclerId: { type: "integer", minimum: 1 },
          routeId: { type: "integer", minimum: 1 },
          collectedOn: { type: "string", format: "date" },
        },
      },
      WeighingInput: {
        allOf: [
          { $ref: "#/components/schemas/WeighingLine" },
          { type: "object", required: ["collectionId"], properties: { collectionId: { type: "integer", minimum: 1 } } },
        ],
      },
      WeighingUpdate: {
        type: "object",
        required: ["grossKg"],
        properties: {
          grossKg: { type: "number", minimum: 0.01 },
          tareKg: { type: "number", minimum: 0, default: 0 },
        },
      },
      WeighingPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          grossKg: { type: "number", minimum: 0.01 },
          tareKg: { type: "number", minimum: 0 },
        },
      },
    },
  },
};
