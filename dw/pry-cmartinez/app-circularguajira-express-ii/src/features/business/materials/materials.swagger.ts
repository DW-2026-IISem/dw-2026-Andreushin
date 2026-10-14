/**
 * OpenAPI docs for the materials feature (materials + rate history).
 * Aggregated by `src/swagger` (external registry); nothing is mounted here.
 *
 * Access mode: JWT + RBAC on every endpoint (bearerAuth, 401 and 403 are applied by src/swagger).
 */

const MATERIALS_TAG = "Materiales";
const RATES_TAG = "Tarifas de material";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico del material (> 0). Si no lo es, la API responde 400.",
  schema: { type: "integer", minimum: 1 },
};

const jsonBody = (ref: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: ref } } },
});

const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});

const errorResponse = (description: string) =>
  jsonResponse(description, "#/components/schemas/ErrorResponse");

const MATERIAL = "#/components/schemas/Material";
const RATE = "#/components/schemas/MaterialRate";

export const materialsSwagger = {
  tags: [
    { name: MATERIALS_TAG, description: "Catálogo de materiales reciclables — **JWT + RBAC**" },
    {
      name: RATES_TAG,
      description:
        "Precio por kg con vigencia. Historial solo de inserción: una corrección es una tarifa nueva — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/materials": {
      get: {
        tags: [MATERIALS_TAG],
        summary: "Listar materiales activos",
        description: "Solo materiales con status = active, por nombre.",
        responses: {
          "200": {
            description: "Lista de materiales activos",
            content: {
              "application/json": {
                schema: { type: "object", properties: { materials: { type: "array", items: { $ref: MATERIAL } } } },
              },
            },
          },
        },
      },
      post: {
        tags: [MATERIALS_TAG],
        summary: "Crear material",
        description: "Status por defecto active.",
        requestBody: jsonBody("#/components/schemas/MaterialInput"),
        responses: {
          "201": jsonResponse("Material creado", MATERIAL),
          "400": errorResponse("Campos faltantes o inválidos"),
          "409": errorResponse("Ya existe un material con ese nombre"),
        },
      },
    },
    "/api/materials/{id}": {
      get: {
        tags: [MATERIALS_TAG],
        summary: "Obtener material activo por id",
        description: "404 si no existe o está inactivo.",
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Material encontrado", MATERIAL),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
      put: {
        tags: [MATERIALS_TAG],
        summary: "Actualizar material (PUT, reemplazo completo)",
        description: "Status no se envía: solo cambia con deactivate.",
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/MaterialUpdate"),
        responses: {
          "200": jsonResponse("Actualizado", MATERIAL),
          "400": errorResponse("Id inválido o payload incompleto"),
          "404": errorResponse("No encontrado o inactivo"),
          "409": errorResponse("Nombre de otro material"),
        },
      },
      patch: {
        tags: [MATERIALS_TAG],
        summary: "Actualizar material (PATCH, parcial)",
        description: "Solo cambian los campos enviados (al menos uno).",
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/MaterialPatch"),
        responses: {
          "200": jsonResponse("Actualizado", MATERIAL),
          "400": errorResponse("Id inválido o cuerpo vacío"),
          "404": errorResponse("No encontrado o inactivo"),
          "409": errorResponse("Nombre de otro material"),
        },
      },
      delete: {
        tags: [MATERIALS_TAG],
        summary: "Eliminar material (físico)",
        description: "También si está inactivo; 409 si tiene tarifas (FK RESTRICT).",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Eliminado",
            content: {
              "application/json": {
                schema: { type: "object", properties: { message: { type: "string", example: "Material eliminado" } } },
              },
            },
          },
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado"),
          "409": errorResponse("El material tiene tarifas registradas"),
        },
      },
    },
    "/api/materials/{id}/deactivate": {
      patch: {
        tags: [MATERIALS_TAG],
        summary: "Eliminar material (lógico)",
        description: "Status = inactive; sus tarifas se conservan.",
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Desactivado", MATERIAL),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado o ya inactivo"),
        },
      },
    },
    "/api/materials/{id}/rates": {
      get: {
        tags: [RATES_TAG],
        summary: "Historial de tarifas del material",
        description: "La más reciente primero.",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Tarifas del material",
            content: {
              "application/json": {
                schema: { type: "object", properties: { rates: { type: "array", items: { $ref: RATE } } } },
              },
            },
          },
          "400": errorResponse("Id inválido"),
          "404": errorResponse("Material no encontrado o inactivo"),
        },
      },
      post: {
        tags: [RATES_TAG],
        summary: "Registrar tarifa (nuevo periodo)",
        description:
          "Si hay una tarifa abierta que empezó antes, se cierra el día anterior a validFrom " +
          "(en la misma transacción). Cualquier otro cruce de periodos responde 409.",
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/MaterialRateInput"),
        responses: {
          "201": jsonResponse("Tarifa registrada", RATE),
          "400": errorResponse("Precio, fechas o id inválidos"),
          "404": errorResponse("Material no encontrado o inactivo"),
          "409": errorResponse("El periodo se cruza con otra tarifa"),
        },
      },
    },
    "/api/materials/{id}/rates/current": {
      get: {
        tags: [RATES_TAG],
        summary: "Tarifa aplicable en una fecha",
        description:
          "La tarifa cuyo periodo contiene la fecha (validFrom <= date <= validTo, o validTo null). " +
          "Nunca se aplica una tarifa fuera de su periodo.",
        parameters: [
          idParameter,
          {
            name: "date",
            in: "query",
            required: false,
            description: "Fecha YYYY-MM-DD. Por defecto, hoy en Colombia.",
            schema: { type: "string", format: "date", example: "2026-09-15" },
          },
        ],
        responses: {
          "200": jsonResponse("Tarifa aplicable", RATE),
          "400": errorResponse("Id o fecha inválidos"),
          "404": errorResponse("Material inactivo o sin tarifa vigente en la fecha"),
        },
      },
    },
  },
  components: {
    schemas: {
      Material: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", maxLength: 60, example: "PET" },
          description: { type: "string", nullable: true, example: "Botellas y envases plásticos transparentes" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MaterialInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 60, example: "PET" },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      MaterialUpdate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 60 },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
      MaterialPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", maxLength: 60 },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
      MaterialRate: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          materialId: { type: "integer", example: 1 },
          pricePerKg: { type: "number", description: "COP por kg neto", example: 1200 },
          validFrom: { type: "string", format: "date", example: "2026-10-01" },
          validTo: { type: "string", format: "date", nullable: true, description: "null = vigente sin cierre" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MaterialRateInput: {
        type: "object",
        required: ["pricePerKg", "validFrom"],
        properties: {
          pricePerKg: { type: "number", minimum: 0.01, maximum: 9999999.99, example: 1200 },
          validFrom: { type: "string", format: "date", example: "2026-10-01" },
          validTo: { type: "string", format: "date", nullable: true, description: "Omitir para tarifa abierta" },
        },
      },
    },
  },
};
