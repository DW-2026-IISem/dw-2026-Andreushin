import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store';
import { TOKENS } from '../testing/session-fixtures';
import { authInterceptor } from './auth-interceptor';

const API = environment.apiUrl;

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
    session.setTokens(TOKENS);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should add the Bearer to API calls but not to login, refresh, logout or other hosts', () => {
    client.get(`${API}/recyclers`).subscribe();
    client.post(`${API}/session/login`, {}).subscribe();
    client.get('https://example.com/data').subscribe();

    expect(http.expectOne(`${API}/recyclers`).request.headers.get('Authorization')).toBe('Bearer access-1');
    expect(http.expectOne(`${API}/session/login`).request.headers.has('Authorization')).toBe(false);
    expect(http.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(false);
  });

  it('should share ONE refresh between two concurrent 401 and retry both with the new access', () => {
    const results: string[] = [];
    client.get<string>(`${API}/recyclers`).subscribe((body) => results.push(body));
    client.get<string>(`${API}/materials`).subscribe((body) => results.push(body));

    http.expectOne(`${API}/recyclers`).flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(`${API}/materials`).flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = http.match(`${API}/session/refresh`);
    expect(refresh).toHaveLength(1);
    refresh[0].flush({ ...TOKENS, accessToken: 'access-2', refreshToken: 'refresh-2' });

    const retryRecyclers = http.expectOne(`${API}/recyclers`);
    const retryMaterials = http.expectOne(`${API}/materials`);
    expect(retryRecyclers.request.headers.get('Authorization')).toBe('Bearer access-2');
    expect(retryMaterials.request.headers.get('Authorization')).toBe('Bearer access-2');
    retryRecyclers.flush('recicladores');
    retryMaterials.flush('materiales');

    expect(results.sort()).toEqual(['materiales', 'recicladores']);
  });

  it('should clear the session and go to the login when the refresh is rejected', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    let failed = false;
    client.get(`${API}/recyclers`).subscribe({ error: () => (failed = true) });

    http.expectOne(`${API}/recyclers`).flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne(`${API}/session/refresh`)
      .flush({ message: 'Refresh token reutilizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('should not retry a 401 from the login itself', () => {
    let status = 0;
    client.post(`${API}/session/login`, {}).subscribe({ error: (error: { status: number }) => (status = error.status) });
    http.expectOne(`${API}/session/login`).flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    http.expectNone(`${API}/session/refresh`);
    expect(status).toBe(401);
  });
});
