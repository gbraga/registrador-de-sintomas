import { Service, computed, inject, signal } from '@angular/core';
import { BodyRegionId } from '../domain/models/body-region';
import { CUSTOM_CATEGORY, Symptom, SymptomCategory } from '../domain/models/symptom';
import { SymptomEntry } from '../domain/models/symptom-entry';
import { CustomSymptomRepository } from '../domain/ports/custom-symptom.repository';
import { SymptomCatalog } from '../domain/ports/symptom-catalog';
import { SymptomEntryRepository } from '../domain/ports/symptom-entry.repository';

/** Estado reativo do diário, lido dos repositórios. Só os casos de uso o alteram. */
@Service()
export class JournalStore {
  private readonly catalog = inject(SymptomCatalog);
  private readonly entryRepository = inject(SymptomEntryRepository);
  private readonly customRepository = inject(CustomSymptomRepository);

  private readonly entriesState = signal<readonly SymptomEntry[]>(this.entryRepository.getAll());
  private readonly customState = signal<readonly Symptom[]>(this.customRepository.getAll());

  readonly entries = computed(() =>
    [...this.entriesState()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  );

  readonly categories = computed<readonly SymptomCategory[]>(() => [
    ...this.catalog.categories(),
    CUSTOM_CATEGORY,
  ]);

  readonly symptoms = computed<readonly Symptom[]>(() => [
    ...this.catalog.symptoms(),
    ...this.customState(),
  ]);

  private readonly symptomIndex = computed(
    () => new Map(this.symptoms().map((s) => [s.id, s] as const)),
  );

  symptomName(id: string): string {
    return this.symptomIndex().get(id)?.name ?? 'Sintoma removido';
  }

  symptomsIn(regionId: BodyRegionId): Symptom[] {
    return this.symptoms().filter((s) => s.regionIds.includes(regionId));
  }

  reload(): void {
    this.entriesState.set(this.entryRepository.getAll());
    this.customState.set(this.customRepository.getAll());
  }
}
