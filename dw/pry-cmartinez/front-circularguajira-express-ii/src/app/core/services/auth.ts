import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccessPayload,
  EffectivePermission,
  LoginPayload,
  Profile,
  RefreshPayload,
  SessionTokens,
} from '../models/auth.model';
import { SessionStore } from './session-store';

/**
 * Client of the Session feature of `app-circularguajira-express-ii`.
 *
 * | Endpoint | Mode | Returns |
 * |---|---|---|
 * | `POST /api/session/login`       | OPEN | `SessionTokens` (tokens only) |
 * | `GET  /api/session/profile`     | JWT  | the user with `roles` |
 * | `GET  /api/session/permissions` | JWT  | `{ permissions }` (effective permissions) |
 * | `POST /api/session/refresh`     | OPEN (refresh token in the body) | `SessionTokens` (rotated) |
 * | `POST /api/session/logout`      | OPEN (refresh token in the body) | `{ message }` |
 *
 * Login does NOT return the user or the permissions: after storing the tokens, profile and
 * permissions are requested in two JWT calls (`forkJoin`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly base = `${environment.apiUrl}/session`;

  /** Login + loading of identity/permissions. It emits only when the session is complete. */
  login(credentials: LoginPayload): Observable<AccessPayload> {
    return this.http.post<SessionTokens>(`${this.base}/login`, credentials).pipe(
      tap((tokens) => this.session.setTokens(tokens)),
      switchMap(() =>
        this.me().pipe(
          // If profile or permissions fail, never leave half a session behind.
          catchError((error: unknown) => {
            this.session.clear();
            return throwError(() => error);
          }),
        ),
      ),
    );
  }

  /** `GET /api/session/profile` + `GET /api/session/permissions`, in parallel. */
  me(): Observable<AccessPayload> {
    return forkJoin({
      user: this.http.get<Profile>(`${this.base}/profile`),
      permissions: this.http
        .get<{ permissions: EffectivePermission[] }>(`${this.base}/permissions`)
        .pipe(map((response) => response.permissions)),
    }).pipe(tap((access) => this.session.setAccess(access)));
  }

  /** Renews the token pair; the previous refresh token is rotated (reusing it revokes the family). */
  refresh(): Observable<SessionTokens> {
    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token en la sesión'));
    }
    const body: RefreshPayload = { refreshToken };
    return this.http.post<SessionTokens>(`${this.base}/refresh`, body).pipe(tap((tokens) => this.session.setTokens(tokens)));
  }

  /**
   * Revokes the presented refresh token. The local state is ALWAYS cleared, even if the
   * backend does not answer (for example, the token already expired).
   */
  logout(): Observable<unknown> {
    const refreshToken = this.session.refreshToken();
    const request: Observable<unknown> = refreshToken
      ? this.http.post(`${this.base}/logout`, { refreshToken })
      : of(null);
    return request.pipe(
      catchError(() => of(null)),
      // Cleared BEFORE emitting, so whoever navigates to /login no longer has a session;
      // `finalize` also covers an unsubscribe before the answer.
      tap(() => this.session.clear()),
      finalize(() => this.session.clear()),
    );
  }
}
