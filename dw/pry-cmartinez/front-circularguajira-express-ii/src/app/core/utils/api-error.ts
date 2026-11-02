import { HttpErrorResponse } from '@angular/common/http';

/**
 * Translates the backend HTTP error into text for the user.
 * Express (`handleError`) always answers `{ message }`; RBAC 403s are opaque on purpose.
 */
export function toApiMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: string } | string | null;

    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Verifica que esté en http://localhost:4000.';
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object' && body.message) {
      return body.message;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Error inesperado';
}
