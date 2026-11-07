import { Component, computed, inject, input, output } from '@angular/core';
import { JournalStore } from '../../application/journal.store';
import { findRegion } from '../../domain/models/body-region';
import { intensityLabel } from '../../domain/models/intensity';
import { SymptomEntry } from '../../domain/models/symptom-entry';
import { formatTime } from './formatters';

/** Linha de um registro: horário, sintoma, região e intensidade. */
@Component({
  selector: 'app-entry-row',
  template: `
    <time [attr.datetime]="entry().occurredAt">{{ time() }}</time>
    <div class="what">
      <span class="name">{{ name() }}</span>
      <span class="region">{{ region() }}</span>
    </div>
    <span
      class="level"
      [style.--level-color]="'var(--heat-' + entry().intensity + ')'"
      [attr.aria-label]="'Intensidade ' + entry().intensity + ' de 5, ' + levelLabel()"
      >{{ entry().intensity }}</span
    >
    @if (removable()) {
      <button
        type="button"
        class="remove"
        (click)="removed.emit(entry())"
        [attr.aria-label]="'Apagar ' + name() + ' às ' + time()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: 3.4rem 1fr auto auto;
      align-items: center;
      gap: 12px;
      min-height: 60px;
      padding: 6px 4px;
    }
    time {
      color: var(--lavender);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .what {
      display: grid;
      min-width: 0;
    }
    .name {
      font-weight: 600;
      line-height: 1.3;
    }
    .region {
      color: var(--lavender);
      font-size: var(--step--1);
    }
    .level {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--level-color);
      color: var(--action-ink);
      font-weight: 760;
      font-size: var(--step--1);
    }
    .remove {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--lavender);
    }
    .remove:hover {
      background: var(--dusk-raised);
      color: var(--mist);
    }
    svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.2;
      stroke-linecap: round;
    }
  `,
})
export class EntryRow {
  readonly entry = input.required<SymptomEntry>();
  readonly removable = input(false);
  readonly removed = output<SymptomEntry>();

  private readonly store = inject(JournalStore);

  protected readonly time = computed(() => formatTime(new Date(this.entry().occurredAt)));
  protected readonly name = computed(() => this.store.symptomName(this.entry().symptomId));
  protected readonly region = computed(() => findRegion(this.entry().regionId).name);
  protected readonly levelLabel = computed(() => intensityLabel(this.entry().intensity));
}
