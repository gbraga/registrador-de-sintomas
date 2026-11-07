import { Service, inject } from '@angular/core';
import { isIntensity } from '../../domain/models/intensity';
import { BODY_REGIONS } from '../../domain/models/body-region';
import { Symptom } from '../../domain/models/symptom';
import { SymptomEntry } from '../../domain/models/symptom-entry';
import { toDateKey } from '../../domain/models/date-key';
import { Clock } from '../../domain/ports/clock';
import { CustomSymptomRepository } from '../../domain/ports/custom-symptom.repository';
import { SymptomEntryRepository } from '../../domain/ports/symptom-entry.repository';
import { FileGateway } from '../ports/file-gateway';
import { JournalStore } from '../journal.store';

interface JournalBackup {
  readonly format: 'diario-fibro';
  readonly version: 1;
  readonly exportedAt: string;
  readonly entries: readonly SymptomEntry[];
  readonly customSymptoms: readonly Symptom[];
}

export interface ImportResult {
  readonly addedEntries: number;
  readonly addedSymptoms: number;
}

const regionIds = new Set<string>(BODY_REGIONS.map((r) => r.id));

function isEntry(value: unknown): value is SymptomEntry {
  const e = value as Partial<SymptomEntry> | null;
  return (
    !!e &&
    typeof e.id === 'string' &&
    typeof e.symptomId === 'string' &&
    typeof e.regionId === 'string' &&
    regionIds.has(e.regionId) &&
    isIntensity(e.intensity) &&
    typeof e.occurredAt === 'string' &&
    !Number.isNaN(Date.parse(e.occurredAt))
  );
}

function isSymptom(value: unknown): value is Symptom {
  const s = value as Partial<Symptom> | null;
  return (
    !!s && typeof s.id === 'string' && typeof s.name === 'string' && Array.isArray(s.regionIds)
  );
}

/** Exporta e importa o diário como arquivo .json (cópia de segurança e troca de aparelho). */
@Service()
export class JournalBackupUseCase {
  private readonly entries = inject(SymptomEntryRepository);
  private readonly customSymptoms = inject(CustomSymptomRepository);
  private readonly files = inject(FileGateway);
  private readonly store = inject(JournalStore);
  private readonly clock = inject(Clock);

  export(): void {
    const now = this.clock.now();
    const backup: JournalBackup = {
      format: 'diario-fibro',
      version: 1,
      exportedAt: now.toISOString(),
      entries: this.entries.getAll(),
      customSymptoms: this.customSymptoms.getAll(),
    };
    this.files.download(`diario-fibro-${toDateKey(now)}.json`, JSON.stringify(backup, null, 2));
  }

  /** Junta o arquivo ao diário atual, sem apagar nem duplicar registros. */
  async import(file: File): Promise<ImportResult> {
    let parsed: Partial<JournalBackup>;
    try {
      parsed = JSON.parse(await this.files.readText(file));
    } catch {
      throw new Error('O arquivo não é um JSON válido.');
    }
    if (parsed?.format !== 'diario-fibro' || !Array.isArray(parsed.entries)) {
      throw new Error(
        'Este arquivo não é uma cópia do diário. Escolha um arquivo exportado por este app.',
      );
    }

    const currentEntries = this.entries.getAll();
    const knownEntries = new Set(currentEntries.map((e) => e.id));
    const newEntries = parsed.entries.filter(isEntry).filter((e) => !knownEntries.has(e.id));

    const currentSymptoms = this.customSymptoms.getAll();
    const knownSymptoms = new Set(currentSymptoms.map((s) => s.id));
    const newSymptoms = (parsed.customSymptoms ?? [])
      .filter(isSymptom)
      .filter((s) => !knownSymptoms.has(s.id));

    this.entries.replaceAll([...currentEntries, ...newEntries]);
    this.customSymptoms.replaceAll([...currentSymptoms, ...newSymptoms]);
    this.store.reload();
    return { addedEntries: newEntries.length, addedSymptoms: newSymptoms.length };
  }
}
