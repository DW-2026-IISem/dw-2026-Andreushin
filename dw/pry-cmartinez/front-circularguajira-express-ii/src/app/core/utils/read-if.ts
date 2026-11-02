import { Observable, of } from 'rxjs';

/**
 * Reads an optional source only when the role may read it; otherwise an empty list.
 * Screens that cross several lists (names of recyclers, routes, materials) keep working
 * for roles without that grant instead of failing the whole `forkJoin` with a 403.
 */
export function readIf<T>(allowed: boolean, source: () => Observable<T[]>): Observable<T[]> {
  return allowed ? source() : of([]);
}
