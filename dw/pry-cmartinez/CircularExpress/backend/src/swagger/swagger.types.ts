// Shape every <plural>.swagger.ts module exports; the registry merges them into one OpenAPI 3 document.
export interface FeatureSwagger {
  tags: { name: string; description: string }[];
  paths: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}
