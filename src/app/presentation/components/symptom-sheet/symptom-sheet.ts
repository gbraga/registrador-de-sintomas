import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AddCustomSymptomUseCase } from '../../../application/use-cases/add-custom-symptom.use-case';
import { JournalStore } from '../../../application/journal.store';
import { RecordSymptomsUseCase } from '../../../application/use-cases/record-symptoms.use-case';
import { BodyRegion } from '../../../domain/models/body-region';
import { addDays, startOfDay } from '../../../domain/models/date-key';
import { Intensity } from '../../../domain/models/intensity';
import { Symptom, SymptomCategory } from '../../../domain/models/symptom';
import { SymptomEntry } from '../../../domain/models/symptom-entry';
import { Clock } from '../../../domain/ports/clock';
import { IntensityPicker } from '../intensity-picker/intensity-picker';

interface SymptomGroup {
  readonly category: SymptomCategory;
  readonly symptoms: readonly Symptom[];
}

type Selection = ReadonlyMap<string, Intensity | null>;

/** Lista de sintomas da região escolhida, com intensidade e horário, para registrar de uma vez. */
@Component({
  selector: 'app-symptom-sheet',
  imports: [IntensityPicker],
  templateUrl: './symptom-sheet.html',
  styleUrl: './symptom-sheet.scss',
  host: { '(keydown.escape)': 'closed.emit()' },
})
export class SymptomSheet {
  readonly region = input.required<BodyRegion>();
  readonly recorded = output<SymptomEntry[]>();
  readonly closed = output<void>();

  private readonly store = inject(JournalStore);
  private readonly recordSymptoms = inject(RecordSymptomsUseCase);
  private readonly addCustomSymptom = inject(AddCustomSymptomUseCase);
  private readonly clock = inject(Clock);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly selection = linkedSignal<BodyRegion, Selection>({
    source: this.region,
    computation: () => new Map(),
  });
  protected readonly timing = signal<'now' | 'earlier'>('now');
  protected readonly dayOffset = signal<0 | 1>(0);
  protected readonly time = signal(this.formatTime(this.clock.now()));
  protected readonly addingCustom = signal(false);
  protected readonly customName = signal('');
  protected readonly error = signal('');

  protected readonly groups = computed<SymptomGroup[]>(() => {
    const symptoms = this.store.symptomsIn(this.region().id);
    return this.store
      .categories()
      .map((category) => ({
        category,
        symptoms: symptoms.filter((s) => s.categoryId === category.id),
      }))
      .filter((g) => g.symptoms.length > 0);
  });

  protected readonly checkedCount = computed(() => this.selection().size);
  protected readonly missingIntensity = computed(
    () => [...this.selection().values()].filter((v) => v === null).length,
  );
  protected readonly canSubmit = computed(
    () => this.checkedCount() > 0 && this.missingIntensity() === 0,
  );
  protected readonly submitLabel = computed(() => {
    const n = this.checkedCount();
    return n <= 1 ? 'Registrar' : `Registrar ${n} sintomas`;
  });

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
    effect(() => {
      this.region();
      this.error.set('');
      this.addingCustom.set(false);
    });
  }

  protected isChecked(id: string): boolean {
    return this.selection().has(id);
  }

  protected intensityOf(id: string): Intensity | null {
    return this.selection().get(id) ?? null;
  }

  protected toggle(id: string): void {
    this.selection.update((current) => {
      const next = new Map(current);
      if (next.has(id)) next.delete(id);
      else next.set(id, null);
      return next;
    });
  }

  protected setIntensity(id: string, value: Intensity | null): void {
    this.selection.update((current) => new Map(current).set(id, value));
  }

  protected chooseEarlier(): void {
    this.timing.set('earlier');
    this.time.set(this.formatTime(this.clock.now()));
  }

  protected addCustom(): void {
    try {
      const symptom = this.addCustomSymptom.execute(this.customName(), this.region().id);
      this.selection.update((current) => new Map(current).set(symptom.id, null));
      this.customName.set('');
      this.addingCustom.set(false);
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  protected submit(): void {
    const occurredAt = this.occurredAt();
    if (!occurredAt) return;
    const drafts = [...this.selection()].flatMap(([symptomId, intensity]) =>
      intensity ? [{ symptomId, intensity, regionId: this.region().id, occurredAt }] : [],
    );
    this.recorded.emit(this.recordSymptoms.execute(drafts));
    this.selection.set(new Map());
  }

  private occurredAt(): Date | null {
    const now = this.clock.now();
    if (this.timing() === 'now') return now;

    const [hours, minutes] = this.time().split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      this.error.set('Informe o horário em que sentiu o sintoma.');
      return null;
    }
    const date = addDays(startOfDay(now), -this.dayOffset());
    date.setHours(hours, minutes);
    if (date > now) {
      this.error.set('Esse horário ainda não chegou. Escolha um horário até agora.');
      return null;
    }
    this.error.set('');
    return date;
  }

  private formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
