import { TestBed } from '@angular/core/testing';
import { Prototype } from './prototype';

/**
 * jsdom does not implement `matchMedia`, so `watchMediaQuery` returns `false` and the
 * component behaves as mobile. The desktop case is tested here by replacing the
 * function before the component is created.
 */
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

describe('Prototype', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prototype],
    }).compileComponents();
  });

  async function createScreen() {
    const fixture = TestBed.createComponent(Prototype);
    await fixture.whenStable();
    return { fixture, compiled: fixture.nativeElement as HTMLElement };
  }

  function menuButton(compiled: HTMLElement): HTMLButtonElement {
    const button = compiled.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    );
    expect(button).toBeTruthy();
    return button as HTMLButtonElement;
  }

  function menuOption(compiled: HTMLElement, label: string): HTMLElement {
    const option = [...compiled.querySelectorAll('a, button')].find(
      (element) => element.textContent?.trim() === label,
    );
    expect(option).toBeTruthy();
    return option as HTMLElement;
  }

  it('should compose the layout and start on Inicio', async () => {
    const { compiled } = await createScreen();

    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('aside app-aside')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
    expect(compiled.querySelector('main h1')?.textContent).toContain('Inicio');
  });

  it('should render the five menu options', async () => {
    const { compiled } = await createScreen();
    const text = compiled.textContent ?? '';

    for (const label of [
      'Inicio',
      'Recicladores',
      'Materiales y tarifas',
      'Rutas de recolección',
      'Pesajes y liquidaciones',
    ]) {
      expect(text).toContain(label);
    }
  });

  it('should always show the menu button, not only on small screens', async () => {
    const { compiled } = await createScreen();

    // `lg:hidden` hid the button exactly when the Aside was already visible.
    expect(menuButton(compiled).classList.contains('lg:hidden')).toBe(false);
  });

  it('should change the title without navigating when an option is chosen', async () => {
    const { fixture, compiled } = await createScreen();

    menuOption(compiled, 'Recicladores').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('main h1')?.textContent).toContain('Recicladores');
    // Still the same screen: no reload and no HTTP request.
    expect(compiled.querySelector('main')).toBeTruthy();
  });

  it('should open the mobile drawer when the header requests it', async () => {
    const { fixture, compiled } = await createScreen();

    expect(fixture.componentInstance.mobileOpen()).toBe(false);

    menuButton(compiled).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileOpen()).toBe(true);
  });

  it('should hide the fixed aside on desktop instead of opening the drawer', async () => {
    const restore = stubDesktopMedia(true);

    try {
      const { fixture, compiled } = await createScreen();
      expect(compiled.querySelector('aside app-aside')).toBeTruthy();

      menuButton(compiled).click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.sidebarCollapsed()).toBe(true);
      expect(compiled.querySelector('aside')).toBeNull();
      expect(fixture.componentInstance.mobileOpen()).toBe(false);
    } finally {
      restore();
    }
  });

  it('should close the drawer after choosing an option', async () => {
    const { fixture, compiled } = await createScreen();

    menuButton(compiled).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.mobileOpen()).toBe(true);

    menuOption(compiled, 'Rutas de recolección').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileOpen()).toBe(false);
    expect(compiled.querySelector('main h1')?.textContent).toContain('Rutas de recolección');
  });
});
