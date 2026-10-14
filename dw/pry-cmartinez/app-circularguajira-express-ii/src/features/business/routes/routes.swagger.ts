/**
 * OpenAPI docs for the routes feature (collection routes + collection points).
 * Aggregated by `src/swagger` (external registry); nothing is mounted here.
 *
 * Phase I: every endpoint is **SIN AUTH** (no JWT, no RBAC).
 */

const ROUTES_TAG = "Rutas";
const POINTS_TAG = "Puntos de recolección";

const idParameter = (what: string) => ({
  name: "id",
  in: "path",
  required: true,
  description: `Id numérico ${what} (> 0). Si no lo es, la API responde 400.`,
  schema: { type: "integer", minimum: 1 },
});

const jsonBody = (ref: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: ref } } },
});

const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: ref } } },
});

const listResponse = (description: string, key: string, ref: string) => ({
  description,
  content: {
    "application/json": {
      schema: { type: "object", properties: { [key]: { type: "array", items: { $ref: ref } } } },
    },
  },
});

const messageResponse = (example: string) => ({
  description: "Eliminado",
  content: {
    "application/json": {
      schema: { type: "object", properties: { message: { type: "string", example } } },
    },
  },
});

const errorResponse = (description: string) =>
  jsonResponse(description, "#/components/schemas/ErrorResponse");

const ROUTE = "#/components/schemas/Route";
const POINT = "#/components/schemas/CollectionPoint";

export const routesSwagger = {
  tags: [
    { name: ROUTES_TAG, description: "Rutas de recolección por municipio — **SIN AUTH** (Fase I)" },
    {
      name: POINTS_TAG,
      description: "Paradas de una ruta con su orden de visita (único por ruta) — **SIN AUTH**",
    },
  ],
  paths: {
    "/api/routes": {
      get: {
        tags: [ROUTES_TAG],
        summary: "Listar rutas activas",
        description: "SIN AUTH — solo rutas con status = active, por nombre.",
        responses: { "200": listResponse("Rutas activas", "routes", ROUTE) },
      },
      post: {
        tags: [ROUTES_TAG],
        summary: "Crear ruta",
        description: "SIN AUTH — status por defecto active.",
        requestBody: jsonBody("#/components/schemas/RouteInput"),
        responses: {
          "201": jsonResponse("Ruta creada", ROUTE),
          "400": errorResponse("Campos faltantes o inválidos"),
          "409": errorResponse("Ya existe una ruta con ese nombre"),
        },
      },
    },
    "/api/routes/{id}": {
      get: {
        tags: [ROUTES_TAG],
        summary: "Obtener ruta activa por id",
        description: "SIN AUTH — 404 si no existe o está inactiva.",
        parameters: [idParameter("de la ruta")],
        responses: {
          "200": jsonResponse("Ruta encontrada", ROUTE),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrada o inactiva"),
        },
      },
      put: {
        tags: [ROUTES_TAG],
        summary: "Actualizar ruta (PUT, reemplazo completo)",
        description: "SIN AUTH — status no se envía: solo cambia con deactivate.",
        parameters: [idParameter("de la ruta")],
        requestBody: jsonBody("#/components/schemas/RouteUpdate"),
        responses: {
          "200": jsonResponse("Actualizada", ROUTE),
          "400": errorResponse("Id inválido o payload incompleto"),
          "404": errorResponse("No encontrada o inactiva"),
          "409": errorResponse("Nombre de otra ruta"),
        },
      },
      patch: {
        tags: [ROUTES_TAG],
        summary: "Actualizar ruta (PATCH, parcial)",
        description: "SIN AUTH — solo cambian los campos enviados (al menos uno).",
        parameters: [idParameter("de la ruta")],
        requestBody: jsonBody("#/components/schemas/RoutePatch"),
        responses: {
          "200": jsonResponse("Actualizada", ROUTE),
          "400": errorResponse("Id inválido o cuerpo vacío"),
          "404": errorResponse("No encontrada o inactiva"),
          "409": errorResponse("Nombre de otra ruta"),
        },
      },
      delete: {
        tags: [ROUTES_TAG],
        summary: "Eliminar ruta (físico)",
        description: "SIN AUTH — también si está inactiva; 409 si aún tiene puntos (FK RESTRICT).",
        parameters: [idParameter("de la ruta")],
        responses: {
          "200": messageResponse("Ruta eliminada"),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrada"),
          "409": errorResponse("La ruta tiene puntos de recolección"),
        },
      },
    },
    "/api/routes/{id}/deactivate": {
      patch: {
        tags: [ROUTES_TAG],
        summary: "Eliminar ruta (lógico)",
        description: "SIN AUTH — status = inactive; ya no admite puntos nuevos.",
        parameters: [idParameter("de la ruta")],
        responses: {
          "200": jsonResponse("Desactivada", ROUTE),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrada o ya inactiva"),
        },
      },
    },
    "/api/routes/{id}/points": {
      get: {
        tags: [ROUTES_TAG, POINTS_TAG],
        summary: "Puntos de una ruta en orden de visita",
        description: "SIN AUTH — solo puntos activos de una ruta activa.",
        parameters: [idParameter("de la ruta")],
        responses: {
          "200": listResponse("Puntos de la ruta", "points", POINT),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("Ruta no encontrada o inactiva"),
        },
      },
    },
    "/api/collection-points": {
      get: {
        tags: [POINTS_TAG],
        summary: "Listar puntos activos",
        description: "SIN AUTH — ordenados por ruta y orden de visita.",
        responses: { "200": listResponse("Puntos activos", "points", POINT) },
      },
      post: {
        tags: [POINTS_TAG],
        summary: "Crear punto de recolección",
        description:
          "SIN AUTH — la ruta debe existir (404) y estar activa (400); el orden de visita no se repite en la ruta (409).",
        requestBody: jsonBody("#/components/schemas/CollectionPointInput"),
        responses: {
          "201": jsonResponse("Punto creado", POINT),
          "400": errorResponse("Campos inválidos o ruta inactiva"),
          "404": errorResponse("Ruta no encontrada"),
          "409": errorResponse("Orden de visita ocupado en la ruta"),
        },
      },
    },
    "/api/collection-points/{id}": {
      get: {
        tags: [POINTS_TAG],
        summary: "Obtener punto activo por id",
        description: "SIN AUTH — 404 si no existe o está inactivo.",
        parameters: [idParameter("del punto")],
        responses: {
          "200": jsonResponse("Punto encontrado", POINT),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado o inactivo"),
        },
      },
      put: {
        tags: [POINTS_TAG],
        summary: "Actualizar punto (PUT, reemplazo completo)",
        description: "SIN AUTH — puede mover el punto a otra ruta activa; valida pertenencia y orden.",
        parameters: [idParameter("del punto")],
        requestBody: jsonBody("#/components/schemas/CollectionPointUpdate"),
        responses: {
          "200": jsonResponse("Actualizado", POINT),
          "400": errorResponse("Payload incompleto o ruta inactiva"),
          "404": errorResponse("Punto o ruta no encontrados"),
          "409": errorResponse("Orden de visita ocupado en la ruta"),
        },
      },
      patch: {
        tags: [POINTS_TAG],
        summary: "Actualizar punto (PATCH, parcial)",
        description: "SIN AUTH — solo cambian los campos enviados; ruta y orden se validan juntos.",
        parameters: [idParameter("del punto")],
        requestBody: jsonBody("#/components/schemas/CollectionPointPatch"),
        responses: {
          "200": jsonResponse("Actualizado", POINT),
          "400": errorResponse("Cuerpo vacío, campo inválido o ruta inactiva"),
          "404": errorResponse("Punto o ruta no encontrados"),
          "409": errorResponse("Orden de visita ocupado en la ruta"),
        },
      },
      delete: {
        tags: [POINTS_TAG],
        summary: "Eliminar punto (físico)",
        description: "SIN AUTH — también si está inactivo.",
        parameters: [idParameter("del punto")],
        responses: {
          "200": messageResponse("Punto de recolección eliminado"),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado"),
        },
      },
    },
    "/api/collection-points/{id}/deactivate": {
      patch: {
        tags: [POINTS_TAG],
        summary: "Eliminar punto (lógico)",
        description: "SIN AUTH — status = inactive; sale del recorrido de la ruta.",
        parameters: [idParameter("del punto")],
        responses: {
          "200": jsonResponse("Desactivado", POINT),
          "400": errorResponse("Id inválido"),
          "404": errorResponse("No encontrado o ya inactivo"),
        },
      },
    },
  },
  components: {
    schemas: {
      Route: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", maxLength: 80, example: "Riohacha Centro" },
          municipality: { type: "string", maxLength: 60, example: "Riohacha" },
          description: { type: "string", nullable: true, example: "Centro histórico y malecón" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RouteInput: {
        type: "object",
        required: ["name", "municipality"],
        properties: {
          name: { type: "string", maxLength: 80 },
          municipality: { type: "string", maxLength: 60 },
          description: { type: "string", maxLength: 255, nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      RouteUpdate: {
        type: "object",
        required: ["name", "municipality"],
        properties: {
          name: { type: "string", maxLength: 80 },
          municipality: { type: "string", maxLength: 60 },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
      RoutePatch: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", maxLength: 80 },
          municipality: { type: "string", maxLength: 60 },
          description: { type: "string", maxLength: 255, nullable: true },
        },
      },
      CollectionPoint: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          routeId: { type: "integer", example: 1 },
          name: { type: "string", maxLength: 100, example: "Tienda La Esquina" },
          address: { type: "string", maxLength: 200, example: "Calle 2 # 7-15, Riohacha" },
          visitOrder: { type: "integer", minimum: 1, maximum: 999, example: 1 },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CollectionPointInput: {
        type: "object",
        required: ["routeId", "name", "address", "visitOrder"],
        properties: {
          routeId: { type: "integer", minimum: 1 },
          name: { type: "string", maxLength: 100 },
          address: { type: "string", maxLength: 200 },
          visitOrder: { type: "integer", minimum: 1, maximum: 999 },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      CollectionPointUpdate: {
        type: "object",
        required: ["routeId", "name", "address", "visitOrder"],
        properties: {
          routeId: { type: "integer", minimum: 1 },
          name: { type: "string", maxLength: 100 },
          address: { type: "string", maxLength: 200 },
          visitOrder: { type: "integer", minimum: 1, maximum: 999 },
        },
      },
      CollectionPointPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          routeId: { type: "integer", minimum: 1 },
          name: { type: "string", maxLength: 100 },
          address: { type: "string", maxLength: 200 },
          visitOrder: { type: "integer", minimum: 1, maximum: 999 },
        },
      },
    },
  },
};
