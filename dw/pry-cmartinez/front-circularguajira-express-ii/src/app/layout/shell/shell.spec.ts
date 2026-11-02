import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
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
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: original });
  };
}

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), MessageService, ConfirmationService],
    }).compileComponents();
  });

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
    const hrefs = [...compiled.querySelectorAll('aside a')].map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/recyclers');
    expect(hrefs).toContain('/materials');
    expect(hrefs).toContain('/routes');
    expect(hrefs).toContain('/collection-points');
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
});
