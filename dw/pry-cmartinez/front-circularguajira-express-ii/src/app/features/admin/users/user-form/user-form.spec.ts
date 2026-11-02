import { TestBed } from '@angular/core/testing';
import { User } from '../../../../core/models/user.model';
import { UserForm, UserFormPayload } from './user-form';

const USER: User = { id: 7, username: 'planta', email: 'planta@circularguajira.co', avatar: null, status: 'active' };

describe('UserForm', () => {
  async function create(user: User | null) {
    await TestBed.configureTestingModule({ imports: [UserForm] }).compileComponents();
    const fixture = TestBed.createComponent(UserForm);
    fixture.componentRef.setInput('user', user);
    await fixture.whenStable();
    const emitted: UserFormPayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => emitted.push(payload));
    return { fixture, form: fixture.componentInstance, emitted };
  }

  it('should send password and status only on create', async () => {
    const { form, emitted } = await create(null);
    form.form.setValue({ username: 'operador', email: 'op@cg.co', password: 'Clave2026', avatar: '', status: 'active' });
    form.submit();
    expect(emitted[0]).toEqual({ username: 'operador', email: 'op@cg.co', avatar: null, password: 'Clave2026', status: 'active' });
  });

  it('should require a password with a letter and a number on create', async () => {
    const { form, emitted } = await create(null);
    form.form.patchValue({ username: 'operador', email: 'op@cg.co', password: 'solotexto' });
    form.submit();
    expect(emitted).toHaveLength(0);
    expect(form.form.controls.password.invalid).toBe(true);
  });

  it('should disable password and status when editing and PATCH without them', async () => {
    const { form, emitted } = await create(USER);
    expect(form.form.controls.password.disabled).toBe(true);
    expect(form.form.controls.status.disabled).toBe(true);
    form.form.patchValue({ email: 'planta2@circularguajira.co' });
    form.submit();
    expect(emitted[0]).toEqual({ username: 'planta', email: 'planta2@circularguajira.co', avatar: null });
  });
});
