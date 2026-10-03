// Reusable OpenAPI fragments for the <plural>.swagger.ts modules.

export const idParam = (description: string) => ({
  name: "id",
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1, example: 1 },
});

export const jsonBody = (schema: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } },
});

// { <key>: <Schema> } response, e.g. { recycler: {...} }.
export const entityResponse = (description: string, key: string, schema: string, extra: Record<string, unknown> = {}) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { ...extra, [key]: { $ref: `#/components/schemas/${schema}` } },
      },
    },
  },
});

// { <key>: <Schema>[] } response, e.g. { recyclers: [...] }.
export const listResponse = (description: string, key: string, schema: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { [key]: { type: "array", items: { $ref: `#/components/schemas/${schema}` } } },
      },
    },
  },
});

export const messageResponse = (description: string, message: string, extra: Record<string, unknown> = {}) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { message: { type: "string", example: message }, ...extra },
      },
    },
  },
});

export const errorRef = (name: "BadRequest" | "NotFound" | "Conflict") => ({ $ref: `#/components/responses/${name}` });
