import {
  entityResponse,
  errorRef,
  idParam,
  jsonBody,
  listResponse,
  messageResponse,
} from "../../../swagger/swagger.helpers";
import { FeatureSwagger } from "../../../swagger/swagger.types";

const TAG = "Recyclers";
const id = idParam("Id del reciclador");

export const recyclersSwagger: FeatureSwagger = {
  tags: [{ name: TAG, description: "Recicladores de oficio y asociaciones de La Guajira" }],
  paths: {
    "/api/recyclers": {
      get: {
        tags: [TAG],
        summary: "Listar recicladores activos",
        description: "Los recicladores con baja lógica (status inactive) no se incluyen.",
        responses: { "200": listResponse("Lista de recicladores activos", "recyclers", "Recycler") },
      },
      post: {
        tags: [TAG],
        summary: "Crear un reciclador",
        requestBody: jsonBody("RecyclerCreate"),
        responses: {
          "201": entityResponse("Reciclador creado", "recycler", "Recycler"),
          "400": errorRef("BadRequest"),
          "409": errorRef("Conflict"),
        },
      },
    },
    "/api/recyclers/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener un reciclador por id",
        parameters: [id],
        responses: {
          "200": entityResponse("Reciclador encontrado", "recycler", "Recycler"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar un reciclador",
        description: "Los campos opcionales que no se envían quedan en null.",
        parameters: [id],
        requestBody: jsonBody("RecyclerCreate"),
        responses: {
          "200": entityResponse("Reciclador actualizado", "recycler", "Recycler"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Actualizar parcialmente un reciclador",
        parameters: [id],
        requestBody: jsonBody("RecyclerPatch"),
        responses: {
          "200": entityResponse("Reciclador actualizado", "recycler", "Recycler"),
          "400": errorRef("BadRequest"),
          "404": errorRef("NotFound"),
          "409": errorRef("Conflict"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar físicamente un reciclador",
        parameters: [id],
        responses: {
          "200": messageResponse("Reciclador eliminado", "Reciclador eliminado", { id: { type: "integer", example: 1 } }),
          "404": errorRef("NotFound"),
        },
      },
    },
    "/api/recyclers/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Baja lógica de un reciclador",
        description: "Cambia status a inactive; el registro deja de aparecer en el listado.",
        parameters: [id],
        responses: {
          "200": messageResponse("Reciclador desactivado", "Reciclador desactivado", {
            recycler: { $ref: "#/components/schemas/Recycler" },
          }),
          "404": errorRef("NotFound"),
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
