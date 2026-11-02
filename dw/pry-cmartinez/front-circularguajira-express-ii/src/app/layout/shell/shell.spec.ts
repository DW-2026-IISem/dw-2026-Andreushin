import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SessionStore } from '../../core/services/session-store';
import { ROLE_PERMISSIONS } from '../../core/testing/role-permissions';
import { signInAs } from '../../core/testing/session-fixtures';
import { Shell } from './shell';

/** jsdom has no `matchMedia`: replace it to exercise the desktop branch. */
function stubDesktopMedia(matches: boolean): () => void {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        matches,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: original,
    });
  };
}

describe('Shell', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();
    signInAs('ADMIN');
  });

  afterEach(() => localStorage.clear());

  async function createShell() {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return { fixture, compiled: fixture.nativeElement as HTMLElement };
  }

  it('should compose header, aside, main, footer and the router outlet', async () => {
    const { compiled } = await createShell();

    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('aside app-aside')).toBeTruthy();
    expect(compiled.querySelector('main#content router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('should host the toast and the confirm dialog once', async () => {
    const { compiled } = await createShell();

    expect(compiled.querySelectorAll('p-toast')).toHaveLength(1);
    expect(compiled.querySelectorAll('p-confirmdialog')).toHaveLength(1);
  });

  it('should render real links in the menu', async () => {
    const { compiled } = await createShell();
    const hrefs = [...compiled.querySelectorAll('aside a')].map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toContain('/recyclers');
    expect(hrefs).toContain('/materials');
    expect(hrefs).toContain('/routes');
    expect(hrefs).toContain('/collection-points');
    expect(hrefs).toContain('/collections');
    expect(hrefs).toContain('/weighings');
    expect(hrefs).toContain('/settlements');
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/prototype');
  });

  it('should open the mobile drawer from the header button', async () => {
    const { fixture, compiled } = await createShell();

    const button = compiled.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileOpen()).toBe(true);
  });

  it('should hide the fixed aside on desktop instead of opening the drawer', async () => {
    const restore = stubDesktopMedia(true);

    try {
      const { fixture, compiled } = await createShell();
      const button = compiled.querySelector(
        'app-header button[aria-label="Mostrar u ocultar el menú"]',
      ) as HTMLButtonElement;

      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.sidebarCollapsed()).toBe(true);
      expect(compiled.querySelector('aside')).toBeNull();
      expect(fixture.componentInstance.mobileOpen()).toBe(false);
    } finally {
      restore();
    }
  });

  it('should pass the session to the header and the aside', async () => {
    const { compiled } = await createShell();

    expect(compiled.querySelector('app-header')?.textContent).toContain('admin');
    expect(compiled.querySelector('app-header')?.textContent).toContain('ADMIN');
    expect(compiled.querySelector('aside app-aside')?.textContent).toContain(
      `${ROLE_PERMISSIONS.ADMIN.length} permisos`,
    );
    expect(compiled.querySelector('aside button[aria-label="Cerrar sesión"]')).toBeTruthy();
  });

  it('should build the menu from the grants of the role (PLANTA)', async () => {
    signInAs('PLANTA');
    const { compiled } = await createShell();
    // Group headers are anchors without href; only the options link to a screen.
    const hrefs = [...compiled.querySelectorAll('aside a[href]')].map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toEqual(['/dashboard', '/materials', '/collections', '/weighings', '/prototype']);
  });

  it('should change the menu without reloading when the permissions change', async () => {
    signInAs('PLANTA');
    const { fixture, compiled } = await createShell();
    expect(compiled.querySelector('aside a[href="/settlements"]')).toBeNull();

    const session = TestBed.inject(SessionStore);
    session.setAccess({
      user: session.user()!,
      permissions: [
        ...session.permissions(),
        { resourceId: 999, method: 'GET', path: '/api/settlements' },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('aside a[href="/settlements"]')).toBeTruthy();
  });

  it('should add the Security group with the five admin screens for ADMIN only', async () => {
    const { compiled } = await createShell();
    const hrefs = [...compiled.querySelectorAll('aside a[href]')].map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/admin/users',
        '/admin/roles',
        '/admin/resources',
        '/admin/role-users',
        '/admin/resource-roles',
      ]),
    );
    expect(compiled.querySelector('aside')?.textContent).toContain('Seguridad');
  });
});
