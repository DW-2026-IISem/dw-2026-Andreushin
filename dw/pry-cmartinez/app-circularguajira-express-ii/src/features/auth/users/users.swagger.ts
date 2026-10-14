import { bearerSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * OpenAPI docs for the users feature. Access mode: JWT (Bearer token of an active user);
 * RBAC (403) is added to these operations in ISS-13.
 */
const TAG = "Usuarios";

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico del usuario (> 0). Si no lo es, la API responde 400.",
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

const errorResponse = (description: string) => jsonResponse(description, "#/components/schemas/ErrorResponse");
const messageResponse = (example: string) => ({
  description: example,
  content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example } } } } },
});

const USER = "#/components/schemas/User";

export const usersSwagger = {
  tags: [
    {
      name: TAG,
      description:
        "Identidades del personal: CRUD, cambio de contraseña y permisos efectivos. La contraseña nunca entra ni sale en claro — **JWT**",
    },
  ],
  paths: {
    "/api/users": {
      get: {
        tags: [TAG],
        summary: "Listar usuarios activos",
        description: "JWT — nunca devuelve `password`.",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Usuarios activos",
            content: {
              "application/json": {
                schema: { type: "object", properties: { users: { type: "array", items: { $ref: USER } } } },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
      post: {
        tags: [TAG],
        summary: "Crear usuario",
        description: "JWT — la contraseña se guarda como hash bcrypt (coste 12).",
        security: bearerSecurity,
        requestBody: jsonBody("#/components/schemas/UserInput"),
        responses: {
          "201": jsonResponse("Usuario creado", USER),
          "400": errorResponse("Datos inválidos o contraseña débil"),
          "401": unauthorizedResponse,
          "409": errorResponse("username o email ya en uso"),
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: [TAG],
        summary: "Obtener usuario activo",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Usuario", USER),
          "400": errorResponse("Id inválido"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
      put: {
        tags: [TAG],
        summary: "Reemplazar usuario (PUT)",
        description: "JWT — no cambia password (usa /password) ni status (usa /deactivate).",
        security: bearerSecurity,
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/UserUpdate"),
        responses: {
          "200": jsonResponse("Actualizado", USER),
          "400": errorResponse("Datos inválidos"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
          "409": errorResponse("username o email ya en uso"),
        },
      },
      patch: {
        tags: [TAG],
        summary: "Modificar usuario (PATCH)",
        security: bearerSecurity,
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/UserPatch"),
        responses: {
          "200": jsonResponse("Actualizado", USER),
          "400": errorResponse("Cuerpo vacío, campo inválido o intento de cambiar password/status"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
          "409": errorResponse("username o email ya en uso"),
        },
      },
      delete: {
        tags: [TAG],
        summary: "Eliminar usuario (físico)",
        description: "JWT — 409 si tiene asignaciones de rol (se desactiva en su lugar).",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": messageResponse("Usuario eliminado"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado"),
          "409": errorResponse("Tiene datos relacionados"),
        },
      },
    },
    "/api/users/{id}/deactivate": {
      patch: {
        tags: [TAG],
        summary: "Desactivar usuario (lógico)",
        description: "JWT — efecto inmediato: sus tokens dejan de valer (401 en la siguiente petición).",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": jsonResponse("Desactivado", USER),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o ya inactivo"),
        },
      },
    },
    "/api/users/{id}/password": {
      patch: {
        tags: [TAG],
        summary: "Cambiar contraseña",
        description:
          "JWT — exige `currentPassword`: ni un administrador cambia una credencial ajena sin conocerla.",
        security: bearerSecurity,
        parameters: [idParameter],
        requestBody: jsonBody("#/components/schemas/ChangePassword"),
        responses: {
          "200": messageResponse("Contraseña actualizada"),
          "400": errorResponse("Contraseña actual incorrecta o nueva contraseña inválida"),
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
    },
    "/api/users/{id}/permissions": {
      get: {
        tags: [TAG],
        summary: "Permisos efectivos del usuario",
        description:
          "JWT — pares (method, path) alcanzables por la cadena role_users → roles → resource_roles → resources, todos activos.",
        security: bearerSecurity,
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Permisos efectivos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { permissions: { type: "array", items: { $ref: "#/components/schemas/EffectivePermission" } } },
                },
              },
            },
          },
          "401": unauthorizedResponse,
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        description: "Nunca incluye password.",
        properties: {
          id: { type: "integer", example: 1 },
          username: { type: "string", example: "bascula" },
          email: { type: "string", format: "email", example: "bascula@circularguajira.co" },
          avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserInput: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", pattern: "^[A-Za-z0-9._-]{3,80}$", example: "operario.bascula" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 8, maxLength: 72, description: "Al menos una letra y un número" },
          avatar: { type: "string", format: "uri", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      UserUpdate: {
        type: "object",
        required: ["username", "email"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", format: "uri", nullable: true },
        },
      },
      UserPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", format: "uri", nullable: true },
        },
      },
      ChangePassword: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password", minLength: 8, maxLength: 72 },
        },
      },
      EffectivePermission: {
        type: "object",
        properties: {
          resourceId: { type: "integer" },
          method: { type: "string", example: "POST" },
          path: { type: "string", example: "/api/weighings" },
        },
      },
    },
  },
};
