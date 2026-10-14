import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { bearerSecurityScheme } from "../shared/http/swagger-security";
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
];

// Shared by every feature: shape produced by src/shared/http/handleError.ts.
const sharedSchemas = {
  ErrorResponse: {
    type: "object",
    properties: { message: { type: "string", example: "Reciclador no encontrado" } },
  },
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

  return {
    openapi: "3.0.3",
    info: {
      title: "CircularGuajira API",
      version: "1.0.0",
      description:
        "API de la cadena de reciclaje CircularGuajira (Express + Sequelize). " +
        "Fase I: todas las rutas business son **SIN AUTH**.",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 4000}`, description: "Local" }],
    tags,
    paths,
    // bearerAuth is declared now; operations start requiring it when they are protected (ISS-13).
    components: { schemas, securitySchemes: bearerSecurityScheme },
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
