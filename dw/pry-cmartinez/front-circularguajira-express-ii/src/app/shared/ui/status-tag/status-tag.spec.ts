import { TestBed } from '@angular/core/testing';
import { StatusTag } from './status-tag';

describe('StatusTag', () => {
  it('should show Activo in green for an active status', async () => {
    const fixture = TestBed.createComponent(StatusTag);
    fixture.componentRef.setInput('status', 'active');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Activo');
    expect(fixture.componentInstance.severity()).toBe('success');
  });

  it('should react when the input changes to inactive', async () => {
    const fixture = TestBed.createComponent(StatusTag);
    fixture.componentRef.setInput('status', 'active');
    await fixture.whenStable();

    fixture.componentRef.setInput('status', 'inactive');
    await fixture.whenStable();

    expect(fixture.componentInstance.label()).toBe('Inactivo');
    expect(fixture.componentInstance.severity()).toBe('danger');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Inactivo');
  });
});
