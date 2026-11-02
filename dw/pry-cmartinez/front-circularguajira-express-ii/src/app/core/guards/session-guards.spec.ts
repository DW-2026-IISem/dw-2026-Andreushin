import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SessionStore } from '../services/session-store';
import { TOKENS } from '../testing/session-fixtures';
import { authGuard } from './auth-guard';
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
});
