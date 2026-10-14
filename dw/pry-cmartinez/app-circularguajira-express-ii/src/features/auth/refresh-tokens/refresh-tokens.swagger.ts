import { bearerSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * OpenAPI docs for the own sessions (refresh tokens) of the authenticated user.
 * Access mode: JWT only; not catalog resources, so src/swagger adds no 403.
 */
const TAG = "Sesiones";
const ITEM = "#/components/schemas/Session";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico de la sesión (> 0).",
  schema: { type: "integer", minimum: 1 },
};
const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});
const errorResponse = (description: string) => jsonResponse(description, "#/components/schemas/ErrorResponse");
const countResponse = (description: string, field: string) => ({
  description,
  content: {
    "application/json": {
      schema: { type: "object", properties: { message: { type: "string" }, [field]: { type: "integer", example: 1 } } },
    },
  },
});
const notMine = errorResponse("No existe o no pertenece al usuario autenticado (no se revela su existencia)");

export const refreshTokensSwagger = {
  tags: [
    {
      name: TAG,
      description:
        "Sesiones persistidas (refresh tokens opacos, solo se guarda su SHA-256) del usuario autenticado: listar, consultar, revocar y purgar — **JWT**",
    },
  ],
  paths: {
    "/api/sessions": {
      get: {
        tags: [TAG],
        summary: "Listar mis sesiones activas",
        description: "JWT — sesiones activas del usuario del token, la más reciente primero. Nunca expone el hash.",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Sesiones activas propias",
            content: {
              "application/json": {
                schema: { type: "object", properties: { sessions: { type: "array", items: { $ref: ITEM } } } },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
      delete: {
        tags: [TAG],
        summary: "Purgar mis sesiones revocadas o expiradas",
        description: "JWT — borrado físico de las sesiones propias que ya no sirven; las activas no se tocan.",
        security: bearerSecurity,
        responses: { "200": countResponse("Sesiones eliminadas", "purged"), "401": unauthorizedResponse },
      },
    },
    "/api/sessions/deactivate-all": {
      patch: {
        tags: [TAG],
        summary: "Revocar todas mis sesiones",
        description: "JWT — cierre de sesión en todos los dispositivos: ningún refresh token propio vuelve a servir.",
        security: bearerSecurity,
        responses: { "200": countResponse("Sesiones revocadas", "revoked"), "401": unauthorizedResponse },
      },
    },
    "/api/sessions/{id}": {
      get: {
        tags: [TAG],
        summary: "Consultar una sesión propia",
        description: "JWT — también si ya está revocada (auditoría).",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Sesión", ITEM),
          "400": errorResponse("Id inválido"),
          "401": unauthorizedResponse,
          "404": notMine,
        },
      },
    },
    "/api/sessions/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Revocar una sesión propia",
        description: "JWT — revocación lógica e idempotente; su refresh token deja de servir de inmediato.",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Sesión revocada",
            content: {
              "application/json": {
                schema: { type: "object", properties: { message: { type: "string" }, session: { $ref: ITEM } } },
              },
            },
          },
          "400": errorResponse("Id inválido"),
          "401": unauthorizedResponse,
          "404": notMine,
        },
      },
    },
  },
  components: {
    schemas: {
      Session: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 3 },
          familyId: { type: "string", format: "uuid", description: "Cadena de rotación de un login" },
          deviceInfo: { type: "string", nullable: true, example: "Mozilla/5.0 ..." },
          expiresAt: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["active", "inactive"] },
          isExpired: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
