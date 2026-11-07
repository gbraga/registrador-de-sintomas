import { SymptomEntry } from '../models/symptom-entry';

export abstract class SymptomEntryRepository {
  abstract getAll(): SymptomEntry[];
  abstract add(entries: readonly SymptomEntry[]): void;
  abstract remove(id: string): void;
  abstract replaceAll(entries: readonly SymptomEntry[]): void;
}
