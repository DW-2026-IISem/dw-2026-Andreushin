import { HttpClient } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../services/notification';
import { toApiMessage } from './api-error';

export type RecordScope = 'active' | 'inactive' | 'all';

/**
 * Which records a list shows. The screen keeps its active rows in `rows`, so its counters,
 * selects and duplicate checks stay active-only; the rest comes from `GET /api/archive/<path>`,
 * a resource granted per role, and is only requested when another scope is chosen.
 */
export class ArchiveScope<T extends { id: number }> {
  readonly scope = signal<RecordScope>('active');
  readonly loading = signal(false);
  private readonly everything = signal<T[]>([]);

  constructor(
    readonly permission: string,
    private readonly read: () => void,
  ) {}

  /** Rows to paint, given the active ones the screen already has. */
  rows(active: T[]): T[] {
    const scope = this.scope();
    if (scope === 'active') {
      return active;
    }
    const activeIds = new Set(active.map((row) => row.id));
    const others = this.everything().filter((row) => !activeIds.has(row.id));
    return scope === 'inactive' ? others : [...active, ...others];
  }

  choose(scope: RecordScope): void {
    this.scope.set(scope);
    this.reload();
  }

  /** The screens call it from `load()`, so a logical or physical delete refreshes it too. */
  reload(): void {
    if (this.scope() !== 'active') {
      this.read();
    }
  }

  /** @internal Result of the request made by `archiveScope`. */
  set(rows: T[]): void {
    this.everything.set(rows);
  }
}

/** Must run in an injection context (a component field). */
export function archiveScope<T extends { id: number }>(path: string, key: string): ArchiveScope<T> {
  const http = inject(HttpClient);
  const notify = inject(NotificationService);
  const archive: ArchiveScope<T> = new ArchiveScope<T>(`GET /api/archive/${path}`, () => {
    archive.loading.set(true);
    http.get<Record<string, T[]>>(`${environment.apiUrl}/archive/${path}`).subscribe({
      next: (response) => {
        archive.set(response[key] ?? []);
        archive.loading.set(false);
      },
      error: (error: unknown) => {
        archive.set([]);
        archive.loading.set(false);
        notify.error('No se pudieron leer los inactivos', toApiMessage(error));
      },
    });
  });
  return archive;
}
