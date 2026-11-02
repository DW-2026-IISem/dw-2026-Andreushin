import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmptyState } from '../empty-state/empty-state';
import { PageHeader } from './page-header';

@Component({
  imports: [PageHeader, EmptyState],
  template: `
    <app-page-header title="Recicladores" subtitle="Alta, edición y baja.">
      <button type="button">Nuevo</button>
    </app-page-header>
    <app-empty-state message="No hay recicladores activos." />
  `,
})
class Host {}

describe('PageHeader and EmptyState', () => {
  it('should render the title, subtitle and projected actions', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const header = (fixture.nativeElement as HTMLElement).querySelector('app-page-header') as HTMLElement;

    expect(header.querySelector('h1')?.textContent).toContain('Recicladores');
    expect(header.textContent).toContain('Alta, edición y baja.');
    expect(header.querySelector('button')?.textContent).toContain('Nuevo');
  });

  it('should render the empty state with its default title', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const empty = (fixture.nativeElement as HTMLElement).querySelector('app-empty-state') as HTMLElement;

    expect(empty.textContent).toContain('Sin registros');
    expect(empty.textContent).toContain('No hay recicladores activos.');
  });
});
