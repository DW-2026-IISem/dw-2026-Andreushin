/**
 * Match between a request and a stored resource. A resource is a (method, path) pattern,
 * e.g. `GET /api/collections/:id`; the request carries the concrete value,
 * e.g. `GET /api/collections/42`. Deliberately strict rules:
 *  - the HTTP verb must match exactly;
 *  - a `:param` segment matches exactly one segment;
 *  - every other segment must be equal, and the segment count must match (no wildcards).
 * So `/api/collections/42` does not match `/api/collections` (a list grant never authorizes
 * a read by id) nor `/api/collections/:id/deactivate`.
 */

// Without query string or fragment, without trailing slash, without repeated `/`.
export const normalizePath = (path: string): string => {
  const withoutQuery = path.split("?")[0].split("#")[0];
  const trimmed = withoutQuery.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

export const pathMatches = (pattern: string, path: string): boolean => {
  const patternParts = normalizePath(pattern).split("/");
  const pathParts = normalizePath(path).split("/");
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) =>
    part.startsWith(":") ? pathParts[i].length > 0 : part === pathParts[i]
  );
};

// RBAC decision: true only if a granted (method, path) covers the request. Deny by default.
export const isOperationGranted = (
  granted: ReadonlyArray<{ method: string; path: string }>,
  method: string,
  path: string
): boolean => {
  const verb = method.toUpperCase();
  return granted.some((resource) => resource.method.toUpperCase() === verb && pathMatches(resource.path, path));
};
