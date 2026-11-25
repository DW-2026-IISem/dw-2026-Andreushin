/**
 * OpenAPI docs for the collectors feature (recyclers).
 * Aggregated by `src/swagger` (external registry); nothing is mounted here.
 *
 * Access mode: JWT + RBAC on every endpoint (bearerAuth, 401 and 403 are applied by src/swagger).
 */

const TAG = "Recicladores";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico (> 0). Si no lo es, la API responde 400.",
  schema: { type: "integer", minimum: 1 },
};

const jsonBody = (ref: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: ref } } },
});

const recyclerResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Recycler" } } },
});

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
});

const recyclerFields = {
  name: { type: "string", maxLength: 120, example: "Asociación Recicladores de Riohacha" },
  documentNumber: {
    type: "string",
    maxLength: 20,
    pattern: "^\\d{5,15}(-\\d)?$",
    description: "Cédula (independiente) o NIT con dígito de verificación (organización). Único.",
    example: "900123456-1",
  },
  recyclerType: { type: "string", enum: ["independent", "organization"], example: "organization" },
  phone: { type: "string", pattern: "^\\+?\\d{7,15}$", example: "3001234567" },
  email: { type: "string", format: "email", nullable: true, example: "contacto@asoriohacha.co" },
  address: { type: "string", maxLength: 200, nullable: true, example: "Calle 15 # 8-20, Riohacha" },
  status: { type: "string", enum: ["active", "inactive"], example: "active" },
};

export const recyclersSwagger = {
  tags: [
    {
      name: TAG,
      description: "CRUD de recicladores y organizaciones — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/recyclers": {
      get: {
        tags: [TAG],
        summary: "Listar recicladores activos",
        description: "Solo recicladores con status = active.",
        responses: {
          "200": {
            description: "Lista de recicladores activos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    recyclers: { type: "array", items: { $ref: "#/components/schemas/Recycler" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear reciclador",
        description: "Sin status queda inactive.",
        requestBody: jsonBody("#/components/schemas/RecyclerInput"),
        responses: {
          "201": recyclerResponse("Reciclador creado"),
          "400": errorResponse("Campos faltantes o con formato inválido"),
          "409": errorResponse("Ya existe un reciclador con ese documento"),
        },
      },
    },
    "/api/recyclers/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener reciclador activo por id",
        description: "404 si no existe o está inactivo.",
        parameters: [idParameter],
        responses: {
          "200": recyclerResponse("Reciclador encontrado"),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Actualizar reciclador (PUT, reemplazo completo)",
        description: "Email y address omitidos quedan en null; permite reactivar.",
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/RecyclerInput"),
        responses: {
          "200": recyclerResponse("Actualizado"),
          "400": errorResponse("Id inválido o payload incompleto"),
          "404": errorResponse("No encontrado"),
          "409": errorResponse("Documento de otro reciclador"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar reciclador (PATCH, parcial)",
        description: "Solo cambian los campos enviados (al menos uno).",
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/RecyclerPatch"),
        responses: {
          "200": recyclerResponse("Actualizado"),
          "400": errorResponse("Id inválido, cuerpo vacío o campo inválido"),
          "404": errorResponse("No encontrado"),
          "409": errorResponse("Documento de otro reciclador"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar reciclador (físico)",
        description: "Borra la fila, también si está inactivo.",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Eliminado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string", example: "Reciclador eliminado" } },
                },
              },
            },
          },
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado"),
        },
      },
    },
    "/api/recyclers/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Eliminar reciclador (lógico)",
        description: "Status = inactive; deja de aparecer en los listados.",
        parameters: [idParameter],
        responses: {
          "200": recyclerResponse("Desactivado"),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado"),
        },
      },
    },
  },
  components: {
    schemas: {
      Recycler: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          ...recyclerFields,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RecyclerInput: {
        type: "object",
        required: ["name", "documentNumber", "recyclerType", "phone"],
        properties: { ...recyclerFields, status: { ...recyclerFields.status, default: "inactive" } },
      },
      RecyclerPatch: {
        type: "object",
        minProperties: 1,
        properties: recyclerFields,
      },
    },
  },
};
