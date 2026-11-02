import { TestBed } from '@angular/core/testing';
import { Recycler, RecyclerPayload } from '../../../core/models/recycler.model';
import { RecyclerForm } from './recycler-form';

const RECYCLER: Recycler = {
  id: 4,
  name: 'Juan Epieyú',
  documentNumber: '1122334455',
  recyclerType: 'independent',
  phone: '3104445566',
  email: null,
  address: 'Barrio Los Olivos',
  status: 'active',
};

describe('RecyclerForm', () => {
  async function createForm(recycler: Recycler | null = null) {
    const fixture = TestBed.createComponent(RecyclerForm);
    fixture.componentRef.setInput('recycler', recycler);
    await fixture.whenStable();
    const saved: RecyclerPayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => saved.push(payload));
    return { fixture, form: fixture.componentInstance, saved };
  }

  function fillValid(form: RecyclerForm): void {
    form.form.patchValue({
      name: '  Recicladora del Sur ',
      documentNumber: '900123456-7',
      recyclerType: 'organization',
      phone: '3001112233',
      email: '',
      address: '',
    });
  }

  it('should start empty, as independent and active, with the status enabled', async () => {
    const { form } = await createForm();
    expect(form.form.getRawValue()).toEqual({
      name: '',
      documentNumber: '',
      recyclerType: 'independent',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    });
    expect(form.form.controls.status.enabled).toBe(true);
  });

  it('should not emit and should mark errors when the form is invalid', async () => {
    const { fixture, form, saved } = await createForm();
    form.submit();
    await fixture.whenStable();

    expect(saved).toEqual([]);
    expect(form.form.controls.name.touched).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('El nombre es obligatorio');
  });

  it('should reject document and phone numbers that the backend would reject', async () => {
    const { form } = await createForm();
    form.form.patchValue({ documentNumber: '12-3', phone: 'abc' });
    expect(form.form.controls.documentNumber.invalid).toBe(true);
    expect(form.form.controls.phone.invalid).toBe(true);

    form.form.patchValue({ documentNumber: '900123456-7', phone: '+573001112233' });
    expect(form.form.controls.documentNumber.valid).toBe(true);
    expect(form.form.controls.phone.valid).toBe(true);
  });

  it('should emit a trimmed create payload with status and nulls for empty optionals', async () => {
    const { form, saved } = await createForm();
    fillValid(form);
    form.submit();

    expect(saved).toEqual([
      {
        name: 'Recicladora del Sur',
        documentNumber: '900123456-7',
        recyclerType: 'organization',
        phone: '3001112233',
        email: null,
        address: null,
        status: 'active',
      },
    ]);
  });

  it('should load the recycler, disable the status and emit no status when editing', async () => {
    const { form, saved } = await createForm(RECYCLER);
    expect(form.form.controls.name.value).toBe('Juan Epieyú');
    expect(form.form.controls.status.disabled).toBe(true);

    form.form.patchValue({ phone: '3200000000' });
    form.submit();

    expect(saved).toHaveLength(1);
    expect(saved[0]).not.toHaveProperty('status');
    expect(saved[0].phone).toBe('3200000000');
  });

  it('should empty the form again when resetKey changes', async () => {
    const { fixture, form } = await createForm();
    form.form.patchValue({ name: 'Borrador sin guardar' });

    fixture.componentRef.setInput('resetKey', 1);
    await fixture.whenStable();

    expect(form.form.controls.name.value).toBe('');
  });

  it('should emit cancelled from the Cancelar button', async () => {
    const { fixture, form } = await createForm();
    let cancelled = 0;
    form.cancelled.subscribe(() => cancelled++);

    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Cancelar'),
    ) as HTMLButtonElement;
    button.click();

    expect(cancelled).toBe(1);
  });
});
