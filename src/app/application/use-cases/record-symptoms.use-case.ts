import { Service, inject } from '@angular/core';
import { SymptomEntry, SymptomEntryDraft } from '../../domain/models/symptom-entry';
import { Clock } from '../../domain/ports/clock';
import { IdGenerator } from '../../domain/ports/id-generator';
import { SymptomEntryRepository } from '../../domain/ports/symptom-entry.repository';
import { JournalStore } from '../journal.store';

@Service()
export class RecordSymptomsUseCase {
  private readonly repository = inject(SymptomEntryRepository);
  private readonly store = inject(JournalStore);
  private readonly clock = inject(Clock);
  private readonly ids = inject(IdGenerator);

  execute(drafts: readonly SymptomEntryDraft[]): SymptomEntry[] {
    const recordedAt = this.clock.now().toISOString();
    const entries = drafts.map<SymptomEntry>((draft) => ({
      id: this.ids.next(),
      symptomId: draft.symptomId,
      regionId: draft.regionId,
      intensity: draft.intensity,
      occurredAt: draft.occurredAt.toISOString(),
      recordedAt,
    }));
    this.repository.add(entries);
    this.store.reload();
    return entries;
  }
}
