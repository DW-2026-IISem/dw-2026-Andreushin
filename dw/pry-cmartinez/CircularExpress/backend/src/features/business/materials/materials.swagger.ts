import {
  entityResponse,
  errorRef,
  idParam,
  jsonBody,
  listResponse,
  messageResponse,
} from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Materials";
const id = idParam("Id del material");

export const materialsSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Catálogo de materiales reciclables" }],
  paths: {
    "/api/materials": {
      get: {
        tags: [TAG],
        summary: "Listar materiales activos",
        description: "Ordenados por nombre; los materiales con baja lógica no se incluyen.",
        responses: { "200": listResponse("Lista de materiales activos", "materials", "Material") },
      },
      post: {
        tags: [TAG],
        summary: "Crear un material",
        requestBody: jsonBody("MaterialCreate"),
        responses: {
          "201": entityResponse("Material creado", "material", "Material"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/materials/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener un material por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Material encontrado", "material", "Material"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar un material",
        description: "Los campos opcionales que no se envían quedan en null.",
        parameters: [id],
        requestBody: jsonBody("MaterialCreate"),
        responses: {
          "200": entityResponse("Material actualizado", "material", "Material"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente un material",
        parameters: [id],
        requestBody: jsonBody("MaterialPatch"),
        responses: {
          "200": entityResponse("Material actualizado", "material", "Material"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente un material",
        description: "Responde 409 si el material ya está referenciado por otros registros.",
        parameters: [id],
        responses: {
          "200": messageResponse("Material eliminado", "Material eliminado", { id: { type: "integer", example: 1 } }),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/materials/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de un material",
        description: "Cambia status a inactive; el material deja de aparecer en el listado.",
        parameters: [id],
        responses: {
          "200": messageResponse("Material desactivado", "Material desactivado", {
            material: { $ref: "#/components/schemas/Material" },
          }),
          "404": errorRef("NotFound"),
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
          name: { type: "string", example: "Plástico PET" },
          description: { type: "string", nullable: true, example: "Botellas de bebidas y envases transparentes" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MaterialCreate: {
        type: "object",
        required: ["name"],
        description: "El nombre es único en el catálogo.",
        properties: {
          name: { type: "string", maxLength: 100, example: "Plástico PET" },
          description: { type: "string", maxLength: 255, nullable: true, example: "Botellas de bebidas (código 1)" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      MaterialPatch: {
        type: "object",
        minProperties: 1,
        description: "Cualquier subconjunto de los campos de MaterialCreate.",
        properties: {
          name: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 255, nullable: true, example: "Incluye tapas" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
  },
};
