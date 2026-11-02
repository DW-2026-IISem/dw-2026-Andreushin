// 1. Only the pieces that are used are imported.
import { Component, computed, effect, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';

// 2. The object that is shown and modified: a recyclable material and its current rate.
export interface Material {
  name: string;
  ratePerKg: number;
  netKg: number;
  active: boolean;
}

/** Returns a new object every time, so the initial state and the reset never share it. */
function createInitialMaterial(): Material {
  return { name: 'Cartón corrugado', ratePerKg: 1800, netKg: 10, active: true };
}

// 3. @Component describes HOW the class is rendered.
@Component({
  host: { class: 'block' }, // <app-example> behaves as a block
  selector: 'app-example', // used as <app-example />
  imports: [Button, Card, InputText, Message, Tag],
  templateUrl: './example.html',
  styleUrl: './example.css',
})
export class Example {
  // 4. STATE: the signal holds a whole object.
  protected readonly material = signal<Material>(createInitialMaterial());

  // 5. DERIVED: calculated from `material()`, never assigned.
  protected readonly settlementValue = computed(
    () => this.material().ratePerKg * this.material().netKg,
  );
  protected readonly statusLabel = computed(() => (this.material().active ? 'Activo' : 'Inactivo'));

  // 6. EFFECT: runs on creation and on every change of the object.
  private readonly logger = effect(() => {
    const { name, ratePerKg, active } = this.material();
    console.log(
      `[example] ${name} · ratePerKg ${ratePerKg} · value ${this.settlementValue()} · ${active ? 'active' : 'inactive'}`,
    );
  });

  // 7. Methods the template calls from its events; each one returns a new object.
  protected rename(event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.material.update((current) => ({ ...current, name }));
  }

  protected changeRate(delta: number): void {
    this.material.update((current) => ({
      ...current,
      ratePerKg: Math.max(0, current.ratePerKg + delta),
    }));
  }

  protected toggleStatus(): void {
    this.material.update((current) => ({ ...current, active: !current.active }));
  }

  protected reset(): void {
    this.material.set(createInitialMaterial());
  }
}
