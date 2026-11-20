import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { Role } from '../../../../core/models/role.model';
import { signInAs } from '../../../../core/testing/session-fixtures';
import { PermissionMatrix } from './permission-matrix';

const API = environment.apiUrl;

const ROLES: Role[] = [
  { id: 1, name: 'ADMIN', description: null, status: 'active' },
  { id: 3, name: 'BASCULA', description: null, status: 'active' },
  { id: 4, name: 'PLANTA', description: null, status: 'active' },
];
const resource = (id: number, method: string, path: string) => ({
  id,
  method,
  path,
  description: null,
  status: 'active',
});
const RESOURCES = [
  resource(1, 'GET', '/api/recyclers'),
  resource(2, 'GET', '/api/recyclers/:id'),
  resource(3, 'POST', '/api/recyclers'),
  resource(4, 'PATCH', '/api/recyclers/:id'),
  resource(5, 'DELETE', '/api/recyclers/:id'),
  resource(6, 'GET', '/api/resource-roles'),
  resource(7, 'POST', '/api/resource-roles/reconcile'),
  resource(8, 'GET', '/api/materials'),
];
const grants = (roleId: number, resourceIds: number[]) =>
  resourceIds.map((resourceId, index) => ({
    id: roleId * 100 + index,
    roleId,
    resourceId,
    status: 'active',
  }));

describe('PermissionMatrix', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionMatrix],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const grantsRequest = (roleId: number) =>
    http.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${API}/resource-roles` &&
        req.params.get('roleId') === String(roleId),
    );

  /** Opens the panel and answers roles, resources and (optionally) the grants of the first role. */
  async function openMatrix(firstRoleGrants: number[] | null = []) {
    const fixture = TestBed.createComponent(PermissionMatrix);
    http.expectOne(`${API}/roles`).flush({ roles: ROLES });
    http.expectOne(`${API}/resources`).flush({ resources: RESOURCES });
    if (firstRoleGrants) {
      grantsRequest(1).flush({ grants: grants(1, firstRoleGrants) });
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return {
      fixture,
      matrix: fixture.componentInstance,
      element: fixture.nativeElement as HTMLElement,
    };
  }

  const box = (element: HTMLElement, label: string) =>
    element.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement;

  /** Moves to another role and answers its grants. */
  async function openRole(
    ctx: Awaited<ReturnType<typeof openMatrix>>,
    roleIndex: number,
    resourceIds: number[],
  ) {
    ctx.matrix.selectRole(ROLES[roleIndex]);
    grantsRequest(ROLES[roleIndex].id).flush({ grants: grants(ROLES[roleIndex].id, resourceIds) });
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();
  }

  const cell = (matrix: PermissionMatrix, entity: string, key: string) =>
    matrix
      .rows()
      .find((row) => row.entity === entity)!
      .cells.find((c) => c.column.key === key)!;

  it('should load roles and resources, then the grants of the first role', async () => {
    const { matrix, element } = await openMatrix([1, 2, 8]);

    expect(matrix.roles().map((role) => role.name)).toEqual(['ADMIN', 'BASCULA', 'PLANTA']);
    expect(matrix.selectedRole()?.name).toBe('ADMIN');
    // Sorted by label: «Concesiones rol-recurso», «Materiales y tarifas», «Recicladores».
    expect(matrix.rows().map((row) => row.entity)).toEqual([
      'resource-roles',
      'materials',
      'recyclers',
    ]);
    expect(element.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0);
  });

  it('should show an empty state, not an error, when there are no roles', async () => {
    const fixture = TestBed.createComponent(PermissionMatrix);
    http.expectOne(`${API}/roles`).flush({ roles: [] });
    http.expectOne(`${API}/resources`).flush({ resources: RESOURCES });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedRole()).toBeNull();
    expect(fixture.componentInstance.error()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin roles');
  });

  it('should show an unchecked matrix, not an error, for a role without permissions', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, []);

    expect(ctx.matrix.error()).toBeNull();
    expect(ctx.matrix.grantsLoaded()).toBe(true);
    const states = ctx.matrix.rows().flatMap((row) => row.cells.map((c) => c.state));
    expect(new Set(states)).toEqual(new Set(['unchecked']));
  });

  it('should not paint the previous role while the next one is loading, and load the right one', async () => {
    const ctx = await openMatrix([1, 2, 3]);
    expect(cell(ctx.matrix, 'recyclers', 'create').state).toBe('checked');

    ctx.matrix.selectRole(ROLES[2]);
    ctx.fixture.detectChanges();
    // Request in flight: nothing from ADMIN is shown and nothing can be saved.
    expect(ctx.matrix.grantsLoaded()).toBe(false);
    expect(ctx.matrix.selectedIds().size).toBe(0);
    expect(ctx.matrix.canSave()).toBe(false);
    expect(ctx.element.querySelectorAll('input[type="checkbox"]').length).toBe(0);

    grantsRequest(4).flush({ grants: grants(4, [8]) });
    await ctx.fixture.whenStable();
    expect(cell(ctx.matrix, 'materials', 'read').state).toBe('checked');
    expect(cell(ctx.matrix, 'recyclers', 'create').state).toBe('unchecked');
  });

  it('should ignore a late answer for a role that is no longer selected', async () => {
    const ctx = await openMatrix([]);
    ctx.matrix.selectRole(ROLES[1]);
    const late = grantsRequest(3);
    ctx.matrix.selectRole(ROLES[2]);
    const current = grantsRequest(4);

    current.flush({ grants: grants(4, [8]) });
    late.flush({ grants: grants(3, [1, 2, 3]) });
    await ctx.fixture.whenStable();

    expect(ctx.matrix.selectedRole()?.name).toBe('PLANTA');
    expect([...ctx.matrix.selectedIds()]).toEqual([8]);
  });

  it('should render a partial operation as indeterminate and the full one as checked', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, [1]); // GET list only: «Leer» groups the list and the detail

    expect(cell(ctx.matrix, 'recyclers', 'read').state).toBe('partial');
    expect(box(ctx.element, 'Leer Recicladores').indeterminate).toBe(true);
    expect(box(ctx.element, 'Leer Recicladores').checked).toBe(false);

    ctx.matrix.selectedIds.set(new Set([1, 2]));
    ctx.fixture.detectChanges();
    expect(box(ctx.element, 'Leer Recicladores').checked).toBe(true);
    expect(box(ctx.element, 'Leer Recicladores').indeterminate).toBe(false);
  });

  it('should show «No disponible» when an entity has no resource for an operation', async () => {
    const { element } = await openMatrix([]);

    expect(box(element, 'Crear Materiales y tarifas')).toBeNull();
    expect(element.textContent).toContain('No disponible');
  });

  it('should check and uncheck every resource a column groups', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, []);

    box(ctx.element, 'Leer Recicladores').click();
    expect([...ctx.matrix.selectedIds()].sort()).toEqual([1, 2]);
    expect(ctx.matrix.changes().added).toEqual([1, 2]);

    box(ctx.element, 'Leer Recicladores').click();
    expect(ctx.matrix.selectedIds().size).toBe(0);
    expect(ctx.matrix.dirty()).toBe(false);
  });

  it('should save { roleId, resourceIds } with the whole selection, then reload the role', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, [1, 2]);
    box(ctx.element, 'Crear Recicladores').click();
    expect(ctx.matrix.canSave()).toBe(true);

    ctx.matrix.save();
    const post = http.expectOne(`${API}/resource-roles/reconcile`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ roleId: 3, resourceIds: [1, 2, 3] });
    // Nothing is announced before the server answers.
    expect(ctx.matrix.saveMessage()).toBeNull();
    expect(ctx.matrix.saving()).toBe(true);

    post.flush({
      message: 'Permisos del rol actualizados',
      result: { roleId: 3, activated: 1, deactivated: 0, totalActive: 3 },
    });
    expect(ctx.matrix.saveMessage()).toBe('Cambios guardados. 3 permisos activos para BASCULA.');
    // After saving the grants are read again from the backend.
    grantsRequest(3).flush({ grants: grants(3, [1, 2, 3]) });
    await ctx.fixture.whenStable();
    expect(ctx.matrix.dirty()).toBe(false);
    expect(ctx.matrix.canSave()).toBe(false);
  });

  it('should send an empty resourceIds when everything is unchecked', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 2, [8]);

    ctx.matrix.clearAll();
    ctx.matrix.save();

    const post = http.expectOne(`${API}/resource-roles/reconcile`);
    expect(post.request.body).toEqual({ roleId: 4, resourceIds: [] });
    post.flush({
      message: 'ok',
      result: { roleId: 4, activated: 0, deactivated: 1, totalActive: 0 },
    });
    grantsRequest(4).flush({ grants: [] });
  });

  it('should show the API error and never announce a save that failed', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, []);
    box(ctx.element, 'Crear Recicladores').click();

    ctx.matrix.save();
    http
      .expectOne(`${API}/resource-roles/reconcile`)
      .flush(
        { message: 'Recursos inexistentes o inactivos: 3' },
        { status: 400, statusText: 'Bad Request' },
      );
    ctx.fixture.detectChanges();

    expect(ctx.matrix.error()).toBe('Recursos inexistentes o inactivos: 3');
    expect(ctx.matrix.saveMessage()).toBeNull();
    expect(ctx.matrix.saving()).toBe(false);
    expect(ctx.element.querySelector('[role="alert"]')?.textContent).toContain(
      'Recursos inexistentes o inactivos: 3',
    );
    // The selection is kept so the administrator can retry.
    expect(ctx.matrix.dirty()).toBe(true);
  });

  it('should show an error, not a success, when the answer has no result', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, []);
    box(ctx.element, 'Crear Recicladores').click();

    ctx.matrix.save();
    http.expectOne(`${API}/resource-roles/reconcile`).flush({ message: 'ok' });

    expect(ctx.matrix.error()).toContain('falta result');
    expect(ctx.matrix.saveMessage()).toBeNull();
  });

  it('should block a second save while the first one is pending', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, []);
    box(ctx.element, 'Crear Recicladores').click();

    ctx.matrix.save();
    expect(ctx.matrix.canSave()).toBe(false);
    ctx.matrix.save();
    ctx.matrix.save();

    const posts = http.match(`${API}/resource-roles/reconcile`);
    expect(posts).toHaveLength(1);
    posts[0].flush({
      message: 'ok',
      result: { roleId: 3, activated: 1, deactivated: 0, totalActive: 1 },
    });
    grantsRequest(3).flush({ grants: grants(3, [1]) });
  });

  it('should not let the checkboxes change while saving or loading', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, []);
    box(ctx.element, 'Crear Recicladores').click();
    ctx.matrix.save();
    ctx.fixture.detectChanges();

    expect(box(ctx.element, 'Leer Recicladores').disabled).toBe(true);

    http.expectOne(`${API}/resource-roles/reconcile`).flush({
      message: 'ok',
      result: { roleId: 3, activated: 1, deactivated: 0, totalActive: 1 },
    });
    grantsRequest(3).flush({ grants: grants(3, [3]) });
  });

  it('should not offer to save a matrix whose grants could not be read', async () => {
    const ctx = await openMatrix(null);
    grantsRequest(1).flush(
      { message: 'Error interno' },
      { status: 500, statusText: 'Server Error' },
    );
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    expect(ctx.matrix.error()).toBe('Error interno');
    expect(ctx.matrix.grantsLoaded()).toBe(false);
    expect(ctx.matrix.canSave()).toBe(false);
    expect(ctx.element.querySelectorAll('input[type="checkbox"]').length).toBe(0);
    expect(ctx.element.textContent).toContain('Reintentar');
  });

  it('should show the connection error when roles and resources cannot be loaded', async () => {
    const fixture = TestBed.createComponent(PermissionMatrix);
    http.expectOne(`${API}/roles`).error(new ProgressEvent('error'), { status: 0 });
    http.match(`${API}/resources`);
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toContain('No se pudo conectar');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should keep the RBAC administration grants of the role the session holds', async () => {
    const ctx = await openMatrix([1, 2, 3, 6, 7, 8]); // ADMIN, and the session is ADMIN

    expect(ctx.matrix.editingOwnRole()).toBe(true);
    expect([...ctx.matrix.lockedIds()].sort()).toEqual([6, 7]);
    expect(cell(ctx.matrix, 'resource-roles', 'read').locked).toBe(true);
    expect(box(ctx.element, 'Leer Concesiones rol-recurso').disabled).toBe(true);
    expect(box(ctx.element, 'Crear Concesiones rol-recurso').disabled).toBe(true);
    // The rest of the matrix stays editable.
    expect(box(ctx.element, 'Leer Recicladores').disabled).toBe(false);

    ctx.matrix.clearAll();
    expect([...ctx.matrix.selectedIds()].sort()).toEqual([6, 7]);
    ctx.matrix.save();
    const post = http.expectOne(`${API}/resource-roles/reconcile`);
    expect(post.request.body).toEqual({ roleId: 1, resourceIds: [6, 7] });
    post.flush({
      message: 'ok',
      result: { roleId: 1, activated: 0, deactivated: 4, totalActive: 2 },
    });
    grantsRequest(1).flush({ grants: grants(1, [6, 7]) });
  });

  it('should not protect anything when the session does not hold the edited role', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, [6, 7]); // BASCULA: the session is ADMIN

    expect(ctx.matrix.editingOwnRole()).toBe(false);
    expect(ctx.matrix.lockedIds().size).toBe(0);
    expect(box(ctx.element, 'Leer Concesiones rol-recurso').disabled).toBe(false);
  });

  it('should only check everything after the administrator confirms', async () => {
    const ctx = await openMatrix([]);
    await openRole(ctx, 1, []);
    const confirm = vi
      .spyOn(TestBed.inject(ConfirmationService), 'confirm')
      .mockImplementation((options: Confirmation) => {
        // First ask, then answer: nothing is selected until accept runs.
        expect(ctx.matrix.selectedIds().size).toBe(0);
        options.accept?.();
        return TestBed.inject(ConfirmationService);
      });

    ctx.matrix.selectAll();

    expect(confirm).toHaveBeenCalledOnce();
    expect(ctx.matrix.selectedIds().size).toBe(RESOURCES.length);
  });

  it('should hide the save button from a session without the reconcile grant', async () => {
    signInAs('LOGISTICA'); // no POST /api/resource-roles/reconcile
    const { element } = await openMatrix([]);

    expect(element.textContent).not.toContain('Guardar permisos');
  });
});
