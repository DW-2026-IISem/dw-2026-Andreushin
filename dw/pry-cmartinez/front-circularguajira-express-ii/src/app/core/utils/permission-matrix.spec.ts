import { Resource } from '../models/resource.model';
import {
  buildPermissionMatrix,
  cellState,
  diffSelection,
  entityOf,
  operationOf,
  toggleCell,
} from './permission-matrix';

const resource = (id: number, method: Resource['method'], path: string): Resource => ({
  id,
  method,
  path,
  description: null,
  status: 'active',
});

const CATALOG: Resource[] = [
  resource(1, 'GET', '/api/recyclers'),
  resource(2, 'GET', '/api/recyclers/:id'),
  resource(3, 'POST', '/api/recyclers'),
  resource(4, 'PUT', '/api/recyclers/:id'),
  resource(5, 'PATCH', '/api/recyclers/:id'),
  resource(6, 'DELETE', '/api/recyclers/:id'),
  resource(7, 'PATCH', '/api/recyclers/:id/deactivate'),
  resource(8, 'GET', '/api/materials'),
  resource(9, 'GET', '/api/materials/:id/rates'),
  resource(10, 'POST', '/api/materials/:id/rates'),
  resource(11, 'GET', '/api/archive/recyclers'),
];

describe('permission matrix', () => {
  it('should take the entity from the first segment, keeping sub-resources with their parent', () => {
    expect(entityOf('/api/recyclers')).toBe('recyclers');
    expect(entityOf('/api/materials/:id/rates/current')).toBe('materials');
    expect(entityOf('/api/archive/recyclers')).toBe('archive');
  });

  it('should group PUT and PATCH as Actualizar and keep special actions with their method', () => {
    expect(operationOf('POST')).toBe('create');
    expect(operationOf('GET')).toBe('read');
    expect(operationOf('PUT')).toBe('update');
    expect(operationOf('PATCH')).toBe('update');
    expect(operationOf('DELETE')).toBe('delete');
  });

  it('should build one row per entity with the resources of every operation', () => {
    const rows = buildPermissionMatrix(CATALOG);
    const recyclers = rows.find((row) => row.entity === 'recyclers')!;

    expect(rows.map((row) => row.entity).sort()).toEqual(['archive', 'materials', 'recyclers']);
    expect(recyclers.label).toBe('Recicladores');
    expect(recyclers.operations.read.map((r) => r.id)).toEqual([1, 2]);
    expect(recyclers.operations.create.map((r) => r.id)).toEqual([3]);
    // PUT, PATCH and the deactivate action all live in the same «Actualizar» cell.
    expect(recyclers.operations.update.map((r) => r.id)).toEqual([4, 5, 7]);
    expect(recyclers.operations.delete.map((r) => r.id)).toEqual([6]);
  });

  it('should leave an operation empty when the entity has no such resource', () => {
    const materials = buildPermissionMatrix(CATALOG).find((row) => row.entity === 'materials')!;
    expect(materials.operations.update).toEqual([]);
    expect(materials.operations.delete).toEqual([]);
  });

  it('should fall back to the raw segment for an entity without a label', () => {
    const [row] = buildPermissionMatrix([resource(1, 'GET', '/api/new-things')]);
    expect(row.label).toBe('new-things');
  });

  it('should be checked, unchecked or partial according to how many ids are selected', () => {
    const read = buildPermissionMatrix(CATALOG).find((row) => row.entity === 'recyclers')!
      .operations.read;

    expect(cellState(read, new Set())).toBe('unchecked');
    expect(cellState(read, new Set([1]))).toBe('partial');
    expect(cellState(read, new Set([1, 2]))).toBe('checked');
    // Ids outside the cell do not count.
    expect(cellState(read, new Set([3, 8]))).toBe('unchecked');
  });

  it('should add or remove EVERY id of the cell when toggled', () => {
    const read = buildPermissionMatrix(CATALOG).find((row) => row.entity === 'recyclers')!
      .operations.read;

    const checked = toggleCell(new Set([8]), read, true);
    expect([...checked].sort()).toEqual([1, 2, 8]);
    // A partial cell becomes fully checked, and unchecking leaves what belongs to other cells.
    expect([...toggleCell(new Set([1, 8]), read, true)].sort()).toEqual([1, 2, 8]);
    expect([...toggleCell(checked, read, false)]).toEqual([8]);
  });

  it('should never remove a locked id when unchecking', () => {
    const read = buildPermissionMatrix(CATALOG).find((row) => row.entity === 'recyclers')!
      .operations.read;

    const result = toggleCell(new Set([1, 2]), read, false, new Set([2]));

    expect([...result]).toEqual([2]);
    expect(cellState(read, result)).toBe('partial');
  });

  it('should not mutate the selection it receives', () => {
    const selected = new Set([1]);
    toggleCell(selected, [resource(2, 'GET', '/api/x')], true);
    expect([...selected]).toEqual([1]);
  });

  it('should tell what changed against the saved grants', () => {
    expect(diffSelection(new Set([1, 2, 3]), new Set([2, 3, 4, 5]))).toEqual({
      added: [4, 5],
      removed: [1],
    });
    expect(diffSelection(new Set([1]), new Set([1]))).toEqual({ added: [], removed: [] });
  });
});
