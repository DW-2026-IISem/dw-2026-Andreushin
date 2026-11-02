import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { PERMISSIONS, PROFILE } from '../../../core/testing/session-fixtures';
import { Login, safeReturnUrl } from './login';

describe('Login', () => {
  const login = vi.fn();

  async function create(returnUrl: string | null) {
    login.mockReset();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return { fixture, element: fixture.nativeElement as HTMLElement, navigate };
  }

  it('should not call the backend while the form is empty', async () => {
    const { fixture, element } = await create(null);
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(login).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Escribe tu usuario o correo.');
  });

  it('should log in with the trimmed identifier and open the returnUrl', async () => {
    const { fixture, navigate } = await create('/settlements');
    login.mockReturnValue(of({ user: PROFILE, permissions: PERMISSIONS }));
    fixture.componentInstance.form.setValue({ identifier: ' admin ', password: 'Admin2026!' });
    fixture.componentInstance.submit();
    expect(login).toHaveBeenCalledWith({ identifier: 'admin', password: 'Admin2026!' });
    expect(navigate).toHaveBeenCalledWith('/settlements');
  });

  it('should show the backend message when the credentials are rejected', async () => {
    const { fixture, element, navigate } = await create(null);
    login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Credenciales inválidas' } })),
    );
    fixture.componentInstance.form.setValue({ identifier: 'admin', password: 'mala' });
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(element.textContent).toContain('Credenciales inválidas');
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should only accept internal return urls', () => {
    expect(safeReturnUrl(null)).toBe('/dashboard');
    expect(safeReturnUrl('/collections?x=1')).toBe('/collections?x=1');
    expect(safeReturnUrl('https://evil.com')).toBe('/dashboard');
    expect(safeReturnUrl('//evil.com')).toBe('/dashboard');
    expect(safeReturnUrl('/login?returnUrl=/x')).toBe('/dashboard');
  });
});
