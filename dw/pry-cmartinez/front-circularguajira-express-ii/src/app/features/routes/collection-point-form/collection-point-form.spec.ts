import { TestBed } from '@angular/core/testing';
import { CollectionPoint, CollectionPointPayload } from '../../../core/models/collection-point.model';
import { Route } from '../../../core/models/route.model';
import { CollectionPointForm } from './collection-point-form';

const ROUTES: Route[] = [
  { id: 1, name: 'Ruta Centro', municipality: 'Riohacha', description: null, status: 'active' },
  { id: 3, name: 'Ruta Maicao', municipality: 'Maicao', description: null, status: 'active' },
];
const POINT: CollectionPoint = { id: 9, routeId: 3, name: 'Bodega La 15', address: 'Calle 15 # 4-20', visitOrder: 2, status: 'active' };

describe('CollectionPointForm', () => {
  async function createForm(point: CollectionPoint | null = null) {
    const fixture = TestBed.createComponent(CollectionPointForm);
    fixture.componentRef.setInput('routes', ROUTES);
    fixture.componentRef.setInput('point', point);
    await fixture.whenStable();
    const saved: CollectionPointPayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => saved.push(payload));
    return { fixture, form: fixture.componentInstance, saved };
  }

  it('should start without route, with visit order 1 and active', async () => {
    const { form } = await createForm();
    expect(form.form.getRawValue()).toEqual({ routeId: null, name: '', address: '', visitOrder: 1, status: 'active' });
  });

  it('should block the submit while no route is chosen', async () => {
    const { fixture, form, saved } = await createForm();
    form.form.patchValue({ name: 'Punto', address: 'Calle 1' });
    form.submit();
    await fixture.whenStable();
    expect(saved).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Elige una ruta activa');
  });

  it('should only accept a visit order from 1 to 999', async () => {
    const { form } = await createForm();
    form.form.patchValue({ visitOrder: 0 });
    expect(form.form.controls.visitOrder.invalid).toBe(true);
    form.form.patchValue({ visitOrder: 1000 });
    expect(form.form.controls.visitOrder.invalid).toBe(true);
    form.form.patchValue({ visitOrder: 999 });
    expect(form.form.controls.visitOrder.valid).toBe(true);
  });

  it('should emit routeId as the numeric id of the chosen route', async () => {
    const { form, saved } = await createForm();
    form.form.patchValue({ routeId: 3, name: ' Tienda Nueva ', address: ' Calle 9 ', visitOrder: 4 });
    form.submit();
    expect(saved).toEqual([{ routeId: 3, name: 'Tienda Nueva', address: 'Calle 9', visitOrder: 4, status: 'active' }]);
    expect(typeof saved[0].routeId).toBe('number');
  });

  it('should keep the selected route when editing and emit no status', async () => {
    const { form, saved } = await createForm(POINT);
    expect(form.form.controls.routeId.value).toBe(3);
    expect(form.form.controls.status.disabled).toBe(true);
    form.submit();
    expect(saved).toEqual([{ routeId: 3, name: 'Bodega La 15', address: 'Calle 15 # 4-20', visitOrder: 2 }]);
  });

  it('should give the route combobox an accessible name from its label', async () => {
    const { fixture } = await createForm();
    const element = fixture.nativeElement as HTMLElement;
    const combobox = element.querySelector('#point-route') as HTMLElement;
    const labelId = combobox.getAttribute('aria-labelledby') as string;
    expect(element.querySelector(`#${labelId}`)?.textContent).toContain('Ruta');
  });
});
