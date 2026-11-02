import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PERMISSIONS, PROFILE, TOKENS } from '../testing/session-fixtures';
import { AuthService } from './auth';
import { SessionStore } from './session-store';

const BASE = `${environment.apiUrl}/session`;

describe('AuthService', () => {
  let auth: AuthService;
  let session: SessionStore;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    session = TestBed.inject(SessionStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should store the tokens and then load profile and permissions in parallel', () => {
    let emitted = false;
    auth.login({ identifier: 'admin', password: 'x' }).subscribe(() => (emitted = true));

    const login = http.expectOne(`${BASE}/login`);
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ identifier: 'admin', password: 'x' });
    login.flush(TOKENS);
    expect(session.accessToken()).toBe('access-1');

    http.expectOne(`${BASE}/profile`).flush(PROFILE);
    expect(emitted).toBe(false);
    http.expectOne(`${BASE}/permissions`).flush({ permissions: PERMISSIONS });

    expect(emitted).toBe(true);
    expect(session.user()?.username).toBe('admin');
    expect(session.permissions()).toEqual(PERMISSIONS);
  });

  it('should not leave half a session when the permissions fail', () => {
    let failed = false;
    auth.login({ identifier: 'admin', password: 'x' }).subscribe({ error: () => (failed = true) });
    http.expectOne(`${BASE}/login`).flush(TOKENS);
    http.expectOne(`${BASE}/profile`).flush(PROFILE);
    http.expectOne(`${BASE}/permissions`).flush({ message: 'boom' }, { status: 500, statusText: 'Error' });

    expect(failed).toBe(true);
    expect(session.isAuthenticated()).toBe(false);
  });

  it('should rotate the pair sending the refresh token in the body', () => {
    session.setTokens(TOKENS);
    auth.refresh().subscribe();
    const request = http.expectOne(`${BASE}/refresh`);
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush({ ...TOKENS, accessToken: 'access-2', refreshToken: 'refresh-2' });
    expect(session.accessToken()).toBe('access-2');
    expect(session.refreshToken()).toBe('refresh-2');
  });

  it('should clear the local session on logout even if the backend fails', () => {
    session.setTokens(TOKENS);
    let clearedBeforeComplete = false;
    auth.logout().subscribe({ complete: () => (clearedBeforeComplete = session.isAuthenticated() === false) });
    const request = http.expectOne(`${BASE}/logout`);
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush({ message: 'caído' }, { status: 500, statusText: 'Error' });
    expect(clearedBeforeComplete).toBe(true);
  });
});
