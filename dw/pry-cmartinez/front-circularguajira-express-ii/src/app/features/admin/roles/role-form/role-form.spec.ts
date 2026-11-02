import { TestBed } from '@angular/core/testing';
import { RolePayload } from '../../../../core/models/role.model';
import { RoleForm } from './role-form';

describe('RoleForm', () => {
  it('should send the name in UPPERCASE and the status only on create', async () => {
    await TestBed.configureTestingModule({ imports: [RoleForm] }).compileComponents();
    const fixture = TestBed.createComponent(RoleForm);
    await fixture.whenStable();
    const emitted: RolePayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => emitted.push(payload));

    fixture.componentInstance.form.setValue({ name: 'auditoria', description: ' Revisa liquidaciones ', status: 'active' });
    fixture.componentInstance.submit();
    expect(emitted[0]).toEqual({ name: 'AUDITORIA', description: 'Revisa liquidaciones', status: 'active' });

    fixture.componentInstance.form.patchValue({ name: '1malo' });
    fixture.componentInstance.submit();
    expect(emitted).toHaveLength(1);
  });
});
