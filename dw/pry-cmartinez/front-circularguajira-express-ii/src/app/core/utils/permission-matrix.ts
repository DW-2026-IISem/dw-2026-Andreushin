import { HttpMethod, Resource } from '../models/resource.model';

/**
 * Pure logic of the «Roles y permisos» matrix. A permission is a resource (method + path);
 * the matrix only GROUPS them so an administrator can read the catalog as a CRUD table:
 *
 *   recurso → entidad (primer segmento del path) → operación (según el método) → ids
 *
 * One cell can hold several resources (list + detail, special actions…), which is why the
 * panel saves `resourceIds`, never one boolean per cell.
 */
export type CrudOperation = 'create' | 'read' | 'update' | 'delete';

export interface CrudColumn {
  key: CrudOperation;
  label: string;
  letter: string;
}

export const CRUD_COLUMNS: readonly CrudColumn[] = [
  { key: 'create', label: 'Crear', letter: 'C' },
  { key: 'read', label: 'Leer', letter: 'R' },
  { key: 'update', label: 'Actualizar', letter: 'U' },
  { key: 'delete', label: 'Eliminar', letter: 'D' },
];

export interface PermissionMatrixRow {
  /** First segment after `/api/`: `recyclers`, `resource-roles`, `archive`… */
  entity: string;
  label: string;
  operations: Record<CrudOperation, Resource[]>;
}

export type CellState = 'checked' | 'unchecked' | 'partial';

const ENTITY_LABELS: Record<string, string> = {
  recyclers: 'Recicladores',
  materials: 'Materiales y tarifas',
  routes: 'Rutas y sus puntos',
  'collection-points': 'Puntos de recolección',
  collections: 'Recolecciones',
  weighings: 'Pesajes',
  settlements: 'Liquidaciones',
  users: 'Usuarios',
  roles: 'Roles',
  resources: 'Recursos',
  'role-users': 'Asignaciones usuario-rol',
  'resource-roles': 'Concesiones rol-recurso',
  archive: 'Registros inactivos',
};

/**
 * PUT and PATCH share «Actualizar». Special actions follow their HTTP method too:
 * `PATCH …/deactivate` or `PATCH …/void` are «Actualizar», `POST …/reconcile` is «Crear».
 */
export function operationOf(method: HttpMethod): CrudOperation {
  switch (method) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

/** `/api/materials/:id/rates` → `materials`; sub-resources stay with their parent entity. */
export function entityOf(path: string): string {
  return path.replace(/^\/api\//, '').split('/')[0] ?? path;
}

const emptyOperations = (): Record<CrudOperation, Resource[]> => ({
  create: [],
  read: [],
  update: [],
  delete: [],
});

/** Rows sorted by label; inside a cell the resources keep the order of the catalog. */
export function buildPermissionMatrix(resources: readonly Resource[]): PermissionMatrixRow[] {
  const rows = new Map<string, PermissionMatrixRow>();
  for (const resource of resources) {
    const entity = entityOf(resource.path);
    let row = rows.get(entity);
    if (!row) {
      row = { entity, label: ENTITY_LABELS[entity] ?? entity, operations: emptyOperations() };
      rows.set(entity, row);
    }
    row.operations[operationOf(resource.method)].push(resource);
  }
  return [...rows.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

/** checked: every resource of the cell is selected · partial: some · unchecked: none. */
export function cellState(
  resources: readonly Resource[],
  selected: ReadonlySet<number>,
): CellState {
  const count = resources.filter((resource) => selected.has(resource.id)).length;
  if (count === 0) {
    return 'unchecked';
  }
  return count === resources.length ? 'checked' : 'partial';
}

/**
 * Checking adds EVERY id of the cell; unchecking removes them all except the `locked` ones
 * (grants the session cannot give up without losing the administration itself).
 */
export function toggleCell(
  selected: ReadonlySet<number>,
  resources: readonly Resource[],
  checked: boolean,
  locked: ReadonlySet<number> = new Set(),
): Set<number> {
  const next = new Set(selected);
  for (const resource of resources) {
    if (checked) {
      next.add(resource.id);
    } else if (!locked.has(resource.id)) {
      next.delete(resource.id);
    }
  }
  return next;
}

/** Ids to add and ids to remove to go from the saved grants to the current selection. */
export function diffSelection(
  saved: ReadonlySet<number>,
  current: ReadonlySet<number>,
): { added: number[]; removed: number[] } {
  return {
    added: [...current].filter((id) => !saved.has(id)),
    removed: [...saved].filter((id) => !current.has(id)),
  };
}
