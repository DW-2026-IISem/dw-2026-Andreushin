import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { SessionStore } from '../../../core/services/session-store';
import { PERMISSIONS, PROFILE, TOKENS } from '../../../core/testing/session-fixtures';
import { Profile } from './profile';

describe('Profile', () => {
  const me = vi.fn(() => of({ user: PROFILE, permissions: PERMISSIONS }));
  const logout = vi.fn(() => of(null));

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: AuthService, useValue: { me, logout } },
      ],
    }).compileComponents();
    const session = TestBed.inject(SessionStore);
    session.setTokens(TOKENS);
    session.setAccess({ user: PROFILE, permissions: PERMISSIONS });
  });
  afterEach(() => localStorage.clear());

  it('should show the user, its roles and its effective permissions', async () => {
    const fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('admin@circularguajira.co');
    expect(text).toContain('ADMIN');
    expect(text).toContain('/api/recyclers/:id');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('should reload profile and permissions, and log out to /login', async () => {
    const fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.refresh();
    expect(me).toHaveBeenCalled();
    fixture.componentInstance.logout();
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
