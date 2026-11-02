import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { SessionStore } from '../../core/services/session-store';

/**
 * Structural directive: paints its content only if the session has the grant.
 *
 *   <ng-container *appHasPermission="'POST /api/recyclers'">…</ng-container>
 *
 * The `effect` reads `permissions()` (through `canPermission`), so after "Actualizar
 * permisos" the view is created or destroyed without reloading. UX only: Express decides.
 */
@Directive({ selector: '[appHasPermission]' })
export class HasPermission {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private readonly session = inject(SessionStore);

  readonly appHasPermission = input.required<string>();

  private shown = false;

  constructor() {
    effect(() => {
      const allowed = this.session.canPermission(this.appHasPermission());
      if (allowed && !this.shown) {
        this.container.createEmbeddedView(this.template);
      } else if (!allowed && this.shown) {
        this.container.clear();
      }
      this.shown = allowed;
    });
  }
}
