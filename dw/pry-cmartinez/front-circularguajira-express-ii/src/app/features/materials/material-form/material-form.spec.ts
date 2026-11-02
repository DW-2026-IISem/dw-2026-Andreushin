import { TestBed } from '@angular/core/testing';
import { Material, MaterialPayload } from '../../../core/models/material.model';
import { MaterialForm } from './material-form';

const MATERIAL: Material = {
  id: 7,
  name: 'Vidrio',
  description: 'Envases de vidrio',
  status: 'active',
};

describe('MaterialForm', () => {
  async function createForm(material: Material | null = null) {
    const fixture = TestBed.createComponent(MaterialForm);
    fixture.componentRef.setInput('material', material);
    await fixture.whenStable();
    const saved: MaterialPayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => saved.push(payload));
    return { fixture, form: fixture.componentInstance, saved };
  }

  it('should start empty and active with the status enabled', async () => {
    const { form } = await createForm();
    expect(form.form.getRawValue()).toEqual({ name: '', description: '', status: 'active' });
    expect(form.form.controls.status.enabled).toBe(true);
  });

  it('should not emit when the name is empty and should show the message', async () => {
    const { fixture, form, saved } = await createForm();
    form.submit();
    await fixture.whenStable();
    expect(saved).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'El nombre es obligatorio',
    );
  });

  it('should reject a name longer than 60 characters (backend limit)', async () => {
    const { form, saved } = await createForm();
    form.form.patchValue({ name: 'x'.repeat(61) });
    form.submit();
    expect(form.form.controls.name.hasError('maxlength')).toBe(true);
    expect(saved).toEqual([]);

    form.form.patchValue({ name: 'x'.repeat(60) });
    expect(form.form.controls.name.valid).toBe(true);
  });

  it('should reject a description longer than 255 characters', async () => {
    const { form } = await createForm();
    form.form.patchValue({ description: 'd'.repeat(256) });
    expect(form.form.controls.description.hasError('maxlength')).toBe(true);
  });

  it('should emit a trimmed create payload with status and null description', async () => {
    const { form, saved } = await createForm();
    form.form.patchValue({ name: '  Chatarra  ', description: '   ' });
    form.submit();
    expect(saved).toEqual([{ name: 'Chatarra', description: null, status: 'active' }]);
  });

  it('should load the material, disable the status and emit no status when editing', async () => {
    const { form, saved } = await createForm(MATERIAL);
    expect(form.form.controls.name.value).toBe('Vidrio');
    expect(form.form.controls.status.disabled).toBe(true);
    form.submit();
    expect(saved).toEqual([{ name: 'Vidrio', description: 'Envases de vidrio' }]);
  });

  it('should empty the form again when resetKey changes', async () => {
    const { fixture, form } = await createForm();
    form.form.patchValue({ name: 'Borrador' });
    fixture.componentRef.setInput('resetKey', 1);
    await fixture.whenStable();
    expect(form.form.controls.name.value).toBe('');
  });

  it('should emit cancelled from the Cancelar button', async () => {
    const { fixture, form } = await createForm();
    let cancelled = 0;
    form.cancelled.subscribe(() => cancelled++);
    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (item) => item.textContent?.includes('Cancelar'),
    ) as HTMLButtonElement;
    button.click();
    expect(cancelled).toBe(1);
  });
});
