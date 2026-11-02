import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AccessPayload, EffectivePermission, Profile, SessionTokens } from '../models/auth.model';
import { HttpMethod } from '../models/resource.model';

const STORAGE_KEY = 'circularguajira.session.v1';

interface PersistedSession {
  accessToken: string;
  refreshToken: string;
  user: Profile | null;
  permissions: EffectivePermission[];
}

/**
 * Single source of truth of the session in the client. Everything is exposed as read-only
 * signals and derived with `computed()`.
 *
 * Contract of `app-circularguajira-express-ii`:
 *  - `POST /api/session/login`       → tokens only.
 *  - `GET  /api/session/profile`     → the user with its `roles: string[]`.
 *  - `GET  /api/session/permissions` → `{ permissions: { resourceId, method, path }[] }`.
 *
 * Security: the backend stays the authority. `can()` only decides what the UI paints; even
 * if the menu is forced, Express answers 401/403.
 *
 * Tokens live in localStorage so the lab is observable in DevTools; in production prefer
 * HttpOnly + Secure + SameSite cookies (localStorage is exposed to XSS).
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  /** Front half of the phase switch. The CircularGuajira backend always requires JWT. */
  readonly authEnabled = environment.requireAuth;

  private readonly _accessToken = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);
  private readonly _user = signal<Profile | null>(null);
  private readonly _permissions = signal<EffectivePermission[]>([]);

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly permissions = this._permissions.asReadonly();

  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  /** Roles come in the profile (the permission rows do not carry them). */
  readonly roleNames = computed(() => [...(this._user()?.roles ?? [])].sort());

  readonly roleLabel = computed(() => (this.roleNames().length ? this.roleNames().join(' · ') : 'Sin rol'));

  readonly initials = computed(() => (this._user()?.username ?? '').slice(0, 2).toUpperCase() || 'IN');

  /** Set of "METHOD /api/path" strings for O(1) lookups in the UI. */
  readonly permissionsIndex = computed(
    () => new Set(this._permissions().map((item) => `${item.method} ${item.path}`)),
  );

  readonly permissionCount = computed(() => this._permissions().length);

  constructor() {
    this.restore();
  }

  /** Login and refresh share the same shape: tokens only. */
  setTokens(tokens: SessionTokens): void {
    this._accessToken.set(tokens.accessToken);
    this._refreshToken.set(tokens.refreshToken);
    this.persist();
  }

  /** Profile + effective permissions (login and "Actualizar permisos"). */
  setAccess(access: AccessPayload): void {
    this._user.set(access.user);
    this._permissions.set(access.permissions ?? []);
    this.persist();
  }

  clear(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this._permissions.set([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage not available */
    }
  }

  /**
   * Does the session have a concrete permission?
   * - Without auth (Phase I) it always allows.
   * - Compares METHOD and path; supports the `:id` of the Resource catalog.
   */
  can(method: HttpMethod | string, path: string): boolean {
    if (!this.authEnabled) {
      return true;
    }
    const verb = method.toUpperCase();
    const requestPath = path.split('?')[0];
    return this._permissions().some(
      (permission) => permission.method === verb && pathMatches(permission.path, requestPath),
    );
  }

  /** `canPermission('GET /api/recyclers')`. */
  canPermission(permission: string): boolean {
    if (!this.authEnabled) {
      return true;
    }
    const separator = permission.indexOf(' ');
    if (separator < 0) {
      return false;
    }
    return this.can(permission.slice(0, separator), permission.slice(separator + 1));
  }

  hasRole(name: string): boolean {
    return this.roleNames().includes(name.toUpperCase());
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const data = JSON.parse(raw) as PersistedSession;
      if (!data.accessToken || !Array.isArray(data.permissions)) {
        this.clear();
        return;
      }
      this._accessToken.set(data.accessToken);
      this._refreshToken.set(data.refreshToken || null);
      this._user.set(data.user ?? null);
      this._permissions.set(data.permissions);
    } catch {
      this.clear();
    }
  }

  private persist(): void {
    const data: PersistedSession = {
      accessToken: this._accessToken() ?? '',
      refreshToken: this._refreshToken() ?? '',
      user: this._user(),
      permissions: this._permissions(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* private mode or full quota: the session stays in memory */
    }
  }
}

/** `/api/recyclers/:id` must recognize `/api/recyclers/7`. */
export function pathMatches(pattern: string, path: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/:[^/]+/g, '/[^/]+');
  return new RegExp(`^${escaped}$`).test(path);
}
