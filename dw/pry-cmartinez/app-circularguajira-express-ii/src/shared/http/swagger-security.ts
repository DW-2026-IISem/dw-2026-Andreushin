/**
 * Reusable OpenAPI pieces for the three access modes (Phase II):
 *   OPEN       -> openSecurity (no credential)
 *   JWT        -> bearerSecurity + 401
 *   JWT + RBAC -> bearerSecurity + 401 and 403
 */

// RFC 6750: `Authorization: Bearer <token>`.
export const bearerSecurityScheme = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Access token JWT obtenido en el login. Enviar como `Authorization: Bearer <access_token>`. " +
      "Vida útil corta (15 min por defecto); se renueva con el refresh token.",
  },
};

export const openSecurity: unknown[] = [];

export const bearerSecurity = [{ bearerAuth: [] }];

const errorContent = { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } };

export const unauthorizedResponse = {
  description: "401 No autenticado: falta el Bearer token, es inválido o expiró, o el usuario está inactivo",
  content: errorContent,
};

export const forbiddenResponse = {
  description: "403 Prohibido: autenticado, pero sin concesión activa para esta operación (deny by default)",
  content: errorContent,
};
