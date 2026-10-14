import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import {
  bearerSecurity,
  bearerSecurityScheme,
  forbiddenResponse,
  unauthorizedResponse,
} from "../shared/http/swagger-security";
import { RESOURCE_CATALOG } from "../features/auth/resources/resource-catalog";
import { recyclersSwagger } from "../features/business/collectors/recyclers.swagger";
import { materialsSwagger } from "../features/business/materials/materials.swagger";
import { routesSwagger } from "../features/business/routes/routes.swagger";
import { weighingSwagger } from "../features/business/weighing/weighing.swagger";
import { settlementsSwagger } from "../features/business/settlements/settlements.swagger";
import { usersSwagger } from "../features/auth/users/users.swagger";
import { rolesSwagger } from "../features/auth/roles/roles.swagger";
import { resourcesSwagger } from "../features/auth/resources/resources.swagger";
import { roleUsersSwagger } from "../features/auth/role-users/role-users.swagger";
import { resourceRolesSwagger } from "../features/auth/resource-roles/resource-roles.swagger";
import { refreshTokensSwagger } from "../features/auth/refresh-tokens/refresh-tokens.swagger";
import { sessionSwagger } from "../features/auth/session/session.swagger";

export type FeatureSwaggerModule = {
  tags: unknown[];
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
};

/**
 * External registry: collects the OpenAPI docs of every feature
 * (same pattern as the SeedersRunner).
 */
const featureSwaggerModules: FeatureSwaggerModule[] = [
  recyclersSwagger,
  materialsSwagger,
  routesSwagger,
  weighingSwagger,
  settlementsSwagger,
  usersSwagger,
  rolesSwagger,
  resourcesSwagger,
  roleUsersSwagger,
  resourceRolesSwagger,
  refreshTokensSwagger,
  sessionSwagger,
];

// Shared by every feature: shape produced by src/shared/http/handleError.ts.
const sharedSchemas = {
  ErrorResponse: {
    type: "object",
    properties: { message: { type: "string", example: "Reciclador no encontrado" } },
  },
};

type OpenApiOperation = { security?: unknown[]; responses?: Record<string, unknown> };

/**
 * JWT + RBAC on every operation that is a catalog resource (the same list `authorize`
 * enforces through the grants), so the docs cannot drift from the routes: bearerAuth,
 * 401 and 403 are declared once here instead of in each feature.
 */
const protectedOperations = new Set(RESOURCE_CATALOG.map((r) => `${r.method} ${r.path}`));

const applyAccessModes = (paths: Record<string, unknown>): void => {
  for (const [path, operations] of Object.entries(paths)) {
    const pattern = path.replace(/\{(\w+)\}/g, ":$1");
    for (const [method, operation] of Object.entries(operations as Record<string, OpenApiOperation>)) {
      if (!protectedOperations.has(`${method.toUpperCase()} ${pattern}`)) continue;
      operation.security = bearerSecurity;
      operation.responses = { ...operation.responses, "401": unauthorizedResponse, "403": forbiddenResponse };
    }
  }
};

export function buildOpenApiDocument() {
  const tags: unknown[] = [];
  const paths: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = { ...sharedSchemas };

  for (const featureModule of featureSwaggerModules) {
    tags.push(...featureModule.tags);
    Object.assign(paths, featureModule.paths);
    if (featureModule.components?.schemas) {
      Object.assign(schemas, featureModule.components.schemas);
    }
  }
  applyAccessModes(paths);

  return {
    openapi: "3.0.3",
    info: {
      title: "CircularGuajira API",
      version: "1.0.0",
      description: [
        "API de la cadena de reciclaje CircularGuajira (Express + Sequelize) con **Auth con RBAC**.",
        "",
        "**Modalidades de acceso** (declaradas por operación):",
        "",
        "- **OPEN**, sin identidad previa: `POST /api/session/login`, `/refresh`, `/logout`.",
        "- **JWT**, access token válido de un usuario activo (401 si no): `/api/session/profile`, `/api/session/permissions`, `/api/sessions/*`.",
        "- **JWT + RBAC**, además una concesión activa del par (método, ruta) (403 si no, deny by default): " +
          "todo el negocio y la administración de seguridad.",
        "",
        "Obtén el `accessToken` en `POST /api/session/login` y pulsa **Authorize**. " +
          "Usuarios de laboratorio (`npm run db:seed`): `admin`, `logistica`, `bascula`, `planta` y `finanzas`; ver README.",
      ].join("\n"),
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 4000}`, description: "Local" }],
    tags,
    paths,
    // Secure by default: an operation without its own `security` requires the access token;
    // the OPEN ones override it with `security: []`.
    security: bearerSecurity,
    components: {
      schemas,
      securitySchemes: bearerSecurityScheme,
      responses: { Unauthorized: unauthorizedResponse, Forbidden: forbiddenResponse },
    },
  };
}

/** Mounts Swagger UI and the OpenAPI JSON. */
export function setupSwagger(app: Application): void {
  const document = buildOpenApiDocument();
  app.get("/api/docs.json", (_req, res) => {
    res.json(document);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(document));
  console.log("📘 Swagger UI: /api/docs  |  OpenAPI JSON: /api/docs.json");
}
