import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Example } from './example';

describe('Example', () => {
  let fixture: ComponentFixture<Example>;
  let element: HTMLElement;

  const clickButton = (label: string): void => {
    const button = Array.from(element.querySelectorAll('button')).find((item) =>
      item.textContent?.includes(label),
    );
    button?.click();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Example],
    }).compileComponents();

    fixture = TestBed.createComponent(Example);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should show the initial material', () => {
    expect(element.textContent).toContain('Cartón corrugado');
    expect(element.textContent).toContain('1800');
    expect(element.textContent).toContain('18000');
    expect(element.textContent).toContain('Activo');
  });

  it('should recalculate the settlement value when the rate goes up by 100', async () => {
    clickButton('+100');
    await fixture.whenStable();
    expect(element.textContent).toContain('1900');
    expect(element.textContent).toContain('19000');
  });

  it('should update the preview when the name changes', async () => {
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = 'PET transparente';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(element.textContent).toContain('Vista previa: PET transparente');
  });

  it('should toggle the status and show the logical delete notice', async () => {
    clickButton('Cambiar estado');
    await fixture.whenStable();
    expect(element.textContent).toContain('Inactivo');
    expect(element.textContent).toContain('borrado lógico');
  });
});
