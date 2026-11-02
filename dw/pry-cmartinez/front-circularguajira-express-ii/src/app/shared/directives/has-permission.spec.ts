import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../../core/services/session-store';
import { PROFILE, TOKENS } from '../../core/testing/session-fixtures';
import { HasPermission } from './has-permission';

@Component({
  imports: [HasPermission],
  template: `
    <button *appHasPermission="'POST /api/recyclers'" id="create">Nuevo</button>
    <button *appHasPermission="'DELETE /api/recyclers/:id'" id="remove">Eliminar</button>
  `,
})
class Host {}

describe('HasPermission', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [Host] });
    const session = TestBed.inject(SessionStore);
    session.setTokens(TOKENS);
    session.setAccess({
      user: PROFILE,
      permissions: [{ resourceId: 3, method: 'POST', path: '/api/recyclers' }],
    });
  });
  afterEach(() => localStorage.clear());

  it('should paint only the content whose grant the session has', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#create')).toBeTruthy();
    expect(element.querySelector('#remove')).toBeNull();
  });

  it('should create and destroy the view when the permissions change, without reloading', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const session = TestBed.inject(SessionStore);

    session.setAccess({
      user: PROFILE,
      permissions: [{ resourceId: 6, method: 'DELETE', path: '/api/recyclers/:id' }],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelector('#create')).toBeNull();
    expect(element.querySelector('#remove')).toBeTruthy();
  });
});
