import { bearerSecurity, openSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * OpenAPI docs for the session feature. login/refresh/logout are OPEN (`security: []`,
 * the credential travels in the body); profile and permissions are JWT. Not catalog
 * resources, so src/swagger adds no 403.
 */
const TAG = "Sesión";

const jsonBody = (ref: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: ref } } },
});
const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});
const errorResponse = (description: string) => jsonResponse(description, "#/components/schemas/ErrorResponse");

export const sessionSwagger = {
  tags: [
    {
      name: TAG,
      description:
        "Login, renovación con rotación, cierre de sesión, perfil y permisos propios — **OPEN** (login, refresh, logout) y **JWT** (perfil, permisos)",
    },
  ],
  paths: {
    "/api/session/login": {
      post: {
        tags: [TAG],
        summary: "Iniciar sesión",
        description:
          "OPEN — `identifier` acepta username o email. Abre una familia de refresh tokens y firma un access token corto. " +
          "Mismo 401 para usuario inexistente, contraseña incorrecta o usuario inactivo (no se enumeran usuarios).",
        security: openSecurity,
        requestBody: jsonBody("#/components/schemas/LoginInput"),
        responses: {
          "200": jsonResponse("Par de tokens", "#/components/schemas/SessionTokens"),
          "400": errorResponse("Faltan identifier o password"),
          "401": errorResponse("Credenciales inválidas"),
        },
      },
    },
    "/api/session/refresh": {
      post: {
        tags: [TAG],
        summary: "Renovar la sesión (rotación)",
        description:
          "OPEN con credencial de sesión — consume el refresh token y emite un par nuevo de la misma familia (transacción con bloqueo de fila). " +
          "Un token ya usado o revocado se trata como robo: se revoca toda la familia (401). La ventana se reinicia en cada rotación.",
        security: openSecurity,
        requestBody: jsonBody("#/components/schemas/RefreshTokenInput"),
        responses: {
          "200": jsonResponse("Par de tokens nuevo (refresh rotado)", "#/components/schemas/SessionTokens"),
          "400": errorResponse("Falta refreshToken"),
          "401": errorResponse("Refresh token inválido, expirado o reutilizado (familia revocada), o usuario inactivo"),
        },
      },
    },
    "/api/session/logout": {
      post: {
        tags: [TAG],
        summary: "Cerrar sesión",
        description:
          "OPEN con credencial de sesión — revoca el refresh token presentado; idempotente. " +
          "El access token vigente expira solo (vida corta).",
        security: openSecurity,
        requestBody: jsonBody("#/components/schemas/RefreshTokenInput"),
        responses: {
          "200": jsonResponse("Sesión cerrada", "#/components/schemas/ErrorResponse"),
          "400": errorResponse("Falta refreshToken"),
        },
      },
    },
    "/api/session/profile": {
      get: {
        tags: [TAG],
        summary: "Mi perfil",
        description: "JWT — identidad pública y roles activos; nunca la contraseña ni hashes.",
        security: bearerSecurity,
        responses: { "200": jsonResponse("Perfil", "#/components/schemas/Profile"), "401": unauthorizedResponse },
      },
    },
    "/api/session/permissions": {
      get: {
        tags: [TAG],
        summary: "Mis permisos efectivos",
        description:
          "JWT — la misma consulta que usa `authorize` (role_users → roles → resource_roles → resources, todo activo): " +
          "lo que aparece aquí es exactamente lo que se autoriza.",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Permisos efectivos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          resourceId: { type: "integer" },
                          method: { type: "string", example: "POST" },
                          path: { type: "string", example: "/api/weighings" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      LoginInput: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: { type: "string", example: "bascula", description: "username o email" },
          password: { type: "string", format: "password", example: "Bascula2026!" },
        },
      },
      RefreshTokenInput: {
        type: "object",
        required: ["refreshToken"],
        properties: { refreshToken: { type: "string", description: "Token opaco recibido en login o refresh (no es un JWT)" } },
      },
      SessionTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string", description: "JWT HS256 de vida corta" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "integer", example: 900, description: "Segundos de vida del access token" },
          refreshToken: { type: "string", description: "Opaco; solo se entrega aquí, el servidor guarda su SHA-256" },
          refreshExpiresIn: { type: "integer", example: 604800 },
        },
      },
      Profile: {
        type: "object",
        properties: {
          id: { type: "integer", example: 3 },
          username: { type: "string", example: "bascula" },
          email: { type: "string", example: "bascula@circularguajira.co" },
          avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
          roles: { type: "array", items: { type: "string" }, example: ["BASCULA"] },
        },
      },
    },
  },
};
