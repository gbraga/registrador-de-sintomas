import { Component, input, model } from '@angular/core';
import { INTENSITY_LEVELS, Intensity, intensityLabel } from '../../../domain/models/intensity';

let nextId = 0;

/** Escolha de intensidade de 1 a 5, como grupo de rádio nativo. */
@Component({
  selector: 'app-intensity-picker',
  template: `
    <fieldset>
      <legend class="visually-hidden">Intensidade de {{ subject() }}</legend>
      <div class="scale">
        @for (level of levels; track level) {
          <label [style.--level-color]="'var(--heat-' + level + ')'">
            <input
              type="radio"
              [name]="name"
              [value]="level"
              [checked]="value() === level"
              (change)="value.set(level)"
            />
            <span class="dot" aria-hidden="true">{{ level }}</span>
            <span class="text">{{ label(level) }}</span>
          </label>
        }
      </div>
    </fieldset>
  `,
  styles: `
    fieldset {
      margin: 0;
      padding: 0;
      border: 0;
      min-width: 0;
    }
    .scale {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
    }
    label {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 4px;
      padding: 6px 0 4px;
      border-radius: var(--radius-s);
      cursor: pointer;
    }
    input {
      position: absolute;
      opacity: 0;
      inset: 0;
      margin: 0;
      cursor: pointer;
    }
    .dot {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      font-weight: 760;
      color: var(--mist);
      box-shadow: inset 0 0 0 2px var(--level-color);
      transition:
        background 160ms,
        color 160ms,
        transform 160ms var(--ease-out);
    }
    .text {
      font-size: 0.75rem;
      line-height: 1.2;
      color: var(--lavender);
      text-align: center;
    }
    input:checked + .dot {
      background: var(--level-color);
      color: var(--action-ink);
      transform: scale(1.08);
      box-shadow:
        0 0 0 4px rgb(255 210 122 / 0.12),
        0 0 18px var(--level-color);
    }
    input:checked ~ .text {
      color: var(--mist);
      font-weight: 700;
    }
    input:focus-visible + .dot {
      outline: 3px solid var(--heat-5);
      outline-offset: 3px;
    }
  `,
})
export class IntensityPicker {
  readonly value = model<Intensity | null>(null);
  readonly subject = input('o sintoma');

  protected readonly levels = INTENSITY_LEVELS;
  protected readonly name = `intensity-${nextId++}`;
  protected readonly label = intensityLabel;
}
