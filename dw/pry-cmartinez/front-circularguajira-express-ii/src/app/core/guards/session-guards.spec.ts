import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SessionStore } from '../services/session-store';
import { TOKENS } from '../testing/session-fixtures';
import { authGuard } from './auth-guard';
import { authOnlyGuard } from './auth-only-guard';
import { permissionGuard } from './permission-guard';
import { signInAs } from '../testing/session-fixtures';
import { guestGuard } from './guest-guard';

const route = {} as ActivatedRouteSnapshot;
const state = (url: string) => ({ url }) as RouterStateSnapshot;

describe('session guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => localStorage.clear());

  const run = <T>(fn: () => T) => TestBed.runInInjectionContext(fn);
  const serialize = (tree: unknown) => TestBed.inject(Router).serializeUrl(tree as UrlTree);

  it('authGuard should send a guest to /login keeping the requested url', () => {
    const result = run(() => authGuard(route, state('/settlements')));
    expect(serialize(result)).toBe('/login?returnUrl=%2Fsettlements');
  });

  it('authGuard should let a session through', () => {
    TestBed.inject(SessionStore).setTokens(TOKENS);
    expect(run(() => authGuard(route, state('/settlements')))).toBe(true);
  });

  it('guestGuard should send a session back to the panel', () => {
    expect(run(() => guestGuard(route, state('/login')))).toBe(true);
    TestBed.inject(SessionStore).setTokens(TOKENS);
    expect(serialize(run(() => guestGuard(route, state('/login'))))).toBe('/dashboard');
  });

  const withPermission = (permission?: string) => ({ data: permission ? { permission } : {} }) as unknown as ActivatedRouteSnapshot;

  it('permissionGuard should open a screen whose grant the role has', () => {
    signInAs('PLANTA');
    expect(run(() => permissionGuard(withPermission('GET /api/materials'), state('/materials')))).toBe(true);
    expect(run(() => permissionGuard(withPermission(), state('/profile')))).toBe(true);
  });

  it('permissionGuard should send to /forbidden with the missing grant (deny by default)', () => {
    signInAs('PLANTA');
    const result = run(() => permissionGuard(withPermission('GET /api/recyclers'), state('/recyclers')));
    expect(serialize(result)).toBe('/forbidden?permission=GET%20%2Fapi%2Frecyclers');
  });

  it('authOnlyGuard should let a Phase II session through', () => {
    expect(TestBed.inject(SessionStore).authEnabled).toBe(true);
    expect(run(() => authOnlyGuard(route, state('/profile')))).toBe(true);
  });
});
