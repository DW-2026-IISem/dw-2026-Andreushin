import { TestBed } from '@angular/core/testing';
import { PERMISSIONS, PROFILE, TOKENS } from '../testing/session-fixtures';
import { SessionStore, pathMatches } from './session-store';

const KEY = 'circularguajira.session.v1';

describe('SessionStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  const create = () => TestBed.inject(SessionStore);

  it('should start without a session', () => {
    const store = create();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.roleLabel()).toBe('Sin rol');
  });

  it('should persist tokens, profile and permissions under one key', () => {
    const store = create();
    store.setTokens(TOKENS);
    store.setAccess({ user: PROFILE, permissions: PERMISSIONS });

    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    expect(saved).toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: PROFILE,
      permissions: PERMISSIONS,
    });
    expect(store.isAuthenticated()).toBe(true);
    expect(store.roleNames()).toEqual(['ADMIN']);
    expect(store.initials()).toBe('AD');
    expect(store.permissionCount()).toBe(2);
  });

  it('should restore a saved session when it is created', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        accessToken: 'a',
        refreshToken: 'r',
        user: PROFILE,
        permissions: PERMISSIONS,
      }),
    );
    const store = create();
    expect(store.accessToken()).toBe('a');
    expect(store.user()?.username).toBe('admin');
  });

  it('should discard a corrupt saved session', () => {
    localStorage.setItem(KEY, '{not json');
    const store = create();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('should clear memory and storage', () => {
    const store = create();
    store.setTokens(TOKENS);
    store.clear();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('should match permissions by method and path, with :id segments', () => {
    const store = create();
    store.setAccess({ user: PROFILE, permissions: PERMISSIONS });
    expect(store.can('get', '/api/recyclers?q=x')).toBe(true);
    expect(store.canPermission('PATCH /api/recyclers/7')).toBe(true);
    expect(store.can('DELETE', '/api/recyclers/7')).toBe(false);
    expect(pathMatches('/api/recyclers/:id', '/api/recyclers/7/deactivate')).toBe(false);
  });
});
