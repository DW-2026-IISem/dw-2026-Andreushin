import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { recyclersSwagger } from "../features/business/collectors/recyclers.swagger";
import { materialsSwagger } from "../features/business/materials/materials.swagger";
import { routesSwagger } from "../features/business/routes/routes.swagger";

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
    components: { schemas },
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
