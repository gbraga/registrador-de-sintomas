import { Injectable, inject } from '@angular/core';
import { SymptomEntry } from '../../domain/models/symptom-entry';
import { SymptomEntryRepository } from '../../domain/ports/symptom-entry.repository';
import { KeyValueStore } from './key-value-store';

const KEY = 'entries';

@Injectable()
export class StoredSymptomEntryRepository extends SymptomEntryRepository {
  private readonly store = inject(KeyValueStore);

  getAll(): SymptomEntry[] {
    return this.store.read<SymptomEntry[]>(KEY) ?? [];
  }

  add(entries: readonly SymptomEntry[]): void {
    this.replaceAll([...this.getAll(), ...entries]);
  }

  remove(id: string): void {
    this.replaceAll(this.getAll().filter((e) => e.id !== id));
  }

  replaceAll(entries: readonly SymptomEntry[]): void {
    this.store.write(KEY, entries);
  }
}
