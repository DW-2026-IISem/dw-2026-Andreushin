import { HttpMethod } from '../models/resource.model';

export type MethodSeverity = 'info' | 'success' | 'warn' | 'danger' | 'secondary';

/** Method traffic light shared by resources, grants and effective permissions. */
export function methodSeverity(method: HttpMethod | string | undefined): MethodSeverity {
  switch (method) {
    case 'GET':
      return 'info';
    case 'POST':
      return 'success';
    case 'PUT':
    case 'PATCH':
      return 'warn';
    case 'DELETE':
      return 'danger';
    default:
      return 'secondary';
  }
}
