import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Recyclers";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "Id del reciclador",
  schema: { type: "integer", minimum: 1, example: 1 },
};

const recyclerResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { type: "object", properties: { recycler: { $ref: "#/components/schemas/Recycler" } } },
    },
  },
});

const jsonBody = (schema: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } },
});

export const recyclersSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Recicladores de oficio y asociaciones de La Guajira" }],
  paths: {
    "/api/recyclers": {
      get: {
        tags: [TAG],
        summary: "Listar recicladores activos",
        description: "Los recicladores con baja lógica (status inactive) no se incluyen.",
        responses: {
          "200": {
            description: "Lista de recicladores activos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { recyclers: { type: "array", items: { $ref: "#/components/schemas/Recycler" } } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear un reciclador",
        requestBody: jsonBody("RecyclerCreate"),
        responses: {
          "201": recyclerResponse("Reciclador creado"),
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/api/recyclers/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener un reciclador por id",
        parameters: [idParam],
        responses: {
          "200": recyclerResponse("Reciclador encontrado"),
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar un reciclador",
        description: "Los campos opcionales que no se envían quedan en null.",
        parameters: [idParam],
        requestBody: jsonBody("RecyclerCreate"),
        responses: {
          "200": recyclerResponse("Reciclador actualizado"),
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente un reciclador",
        parameters: [idParam],
        requestBody: jsonBody("RecyclerPatch"),
        responses: {
          "200": recyclerResponse("Reciclador actualizado"),
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente un reciclador",
        parameters: [idParam],
        responses: {
          "200": {
            description: "Reciclador eliminado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Reciclador eliminado" },
                    id: { type: "integer", example: 1 },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/recyclers/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de un reciclador",
        description: "Cambia status a inactive; el registro deja de aparecer en el listado.",
        parameters: [idParam],
        responses: {
          "200": {
            description: "Reciclador desactivado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Reciclador desactivado" },
                    recycler: { $ref: "#/components/schemas/Recycler" },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
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
          name: { type: "string", example: "Asociación de Recicladores de Riohacha" },
          description: { type: "string", nullable: true, example: "Asociación local de la alta Guajira" },
          phone: { type: "string", nullable: true, example: "3001234567" },
          email: { type: "string", format: "email", nullable: true, example: "recicladores.riohacha@gmail.com" },
          documentNumber: { type: "string", nullable: true, example: "NIT-900123456-1" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RecyclerCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 150, example: "Asociación de Recicladores de Riohacha" },
          description: { type: "string", maxLength: 255, nullable: true },
          phone: { type: "string", maxLength: 30, nullable: true, example: "3001234567" },
          email: { type: "string", format: "email", maxLength: 150, nullable: true },
          documentNumber: { type: "string", maxLength: 50, nullable: true, example: "NIT-900123456-1" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      RecyclerPatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de RecyclerCreate.",
        properties: {
          name: { type: "string", maxLength: 150 },
          description: { type: "string", maxLength: 255, nullable: true },
          phone: { type: "string", maxLength: 30, nullable: true, example: "3105550000" },
          email: { type: "string", format: "email", maxLength: 150, nullable: true },
          documentNumber: { type: "string", maxLength: 50, nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
