import { Service, inject } from '@angular/core';
import { SymptomEntry } from '../../domain/models/symptom-entry';
import { SymptomEntryRepository } from '../../domain/ports/symptom-entry.repository';
import { JournalStore } from '../journal.store';

@Service()
export class RemoveEntriesUseCase {
  private readonly repository = inject(SymptomEntryRepository);
  private readonly store = inject(JournalStore);

  execute(ids: readonly string[]): void {
    ids.forEach((id) => this.repository.remove(id));
    this.store.reload();
  }

  /** Desfaz uma remoção, devolvendo os registros como estavam. */
  restore(entries: readonly SymptomEntry[]): void {
    this.repository.add(entries);
    this.store.reload();
  }
}
