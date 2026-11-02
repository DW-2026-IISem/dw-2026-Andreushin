import { TestBed } from '@angular/core/testing';
import { Route, RoutePayload } from '../../../core/models/route.model';
import { RouteForm } from './route-form';

const ROUTE: Route = { id: 2, name: 'Ruta Maicao Norte', municipality: 'Maicao', description: 'Barrios del norte', status: 'active' };

describe('RouteForm', () => {
  async function createForm(route: Route | null = null) {
    const fixture = TestBed.createComponent(RouteForm);
    fixture.componentRef.setInput('route', route);
    await fixture.whenStable();
    const saved: RoutePayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => saved.push(payload));
    return { fixture, form: fixture.componentInstance, saved };
  }

  it('should require name and municipality', async () => {
    const { fixture, form, saved } = await createForm();
    form.submit();
    await fixture.whenStable();
    expect(saved).toEqual([]);
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('El nombre es obligatorio');
    expect(text).toContain('El municipio es obligatorio');
  });

  it('should apply the backend limits (name 80, municipality 60)', async () => {
    const { form } = await createForm();
    form.form.patchValue({ name: 'n'.repeat(81), municipality: 'm'.repeat(61) });
    expect(form.form.controls.name.hasError('maxlength')).toBe(true);
    expect(form.form.controls.municipality.hasError('maxlength')).toBe(true);
  });

  it('should emit a trimmed create payload with status', async () => {
    const { form, saved } = await createForm();
    form.form.patchValue({ name: ' Ruta Sur ', municipality: ' Uribia ', description: '' });
    form.submit();
    expect(saved).toEqual([{ name: 'Ruta Sur', municipality: 'Uribia', description: null, status: 'active' }]);
  });

  it('should load the route and emit no status when editing', async () => {
    const { form, saved } = await createForm(ROUTE);
    expect(form.form.controls.status.disabled).toBe(true);
    form.submit();
    expect(saved).toEqual([{ name: 'Ruta Maicao Norte', municipality: 'Maicao', description: 'Barrios del norte' }]);
  });
});
