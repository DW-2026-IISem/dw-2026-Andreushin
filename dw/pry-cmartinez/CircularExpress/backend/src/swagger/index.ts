import { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { recyclersSwagger } from "../features/business/recyclers/recyclers.swagger";
import { routesSwagger } from "../features/business/routes/routes.swagger";
import { FeatureSwagger } from "./swagger.types";

// Registry: add each feature's <plural>.swagger.ts module here.
const featureSwaggerModules: FeatureSwagger[] = [recyclersSwagger, routesSwagger];

const errorResponse = (description: string, example: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { error: example },
    },
  },
});

const coreSwagger: FeatureSwagger = {
  tags: [{ name: "System", description: "Estado del servicio" }],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Servicio disponible",
            content: {
              "application/json": {
                example: { status: "ok", service: "circularguajira-api", timestamp: "2026-10-03T12:00:00.000Z" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
          details: { description: "Detalle opcional del error (lista de validaciones o datos en conflicto)" },
        },
      },
    },
  },
};

export function buildOpenApiDocument() {
  const tags: FeatureSwagger["tags"] = [];
  const paths: FeatureSwagger["paths"] = {};
  const schemas: Record<string, unknown> = {};

  for (const swaggerModule of [coreSwagger, ...featureSwaggerModules]) {
    tags.push(...swaggerModule.tags);
    Object.assign(paths, swaggerModule.paths);
    Object.assign(schemas, swaggerModule.components?.schemas ?? {});
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "CircularGuajira Backend API",
      version: "1.0.0",
      description: "API de trazabilidad de la cadena de reciclaje de La Guajira (Express 5 + Sequelize).",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 4000}`, description: "Servidor local" }],
    tags,
    paths,
    components: {
      schemas,
      responses: {
        BadRequest: errorResponse("Datos inválidos", "Datos de reciclador inválidos"),
        NotFound: errorResponse("Recurso no encontrado", "Reciclador no encontrado"),
        Conflict: errorResponse("Conflicto con un registro existente", "Ya existe un reciclador con ese número de documento"),
      },
    },
  };
}

export function setupSwagger(app: Application): void {
  const document = buildOpenApiDocument();
  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.json(document);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(document, { customSiteTitle: "CircularGuajira API" }));
  console.log("📘 Swagger UI ready at /api/docs");
}
