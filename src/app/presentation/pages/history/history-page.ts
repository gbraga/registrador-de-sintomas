import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JournalStore } from '../../../application/journal.store';
import { JournalBackupUseCase } from '../../../application/use-cases/journal-backup.use-case';
import { fromDateKey, toDateKey } from '../../../domain/models/date-key';
import { SymptomEntry } from '../../../domain/models/symptom-entry';
import { Clock } from '../../../domain/ports/clock';
import { EntryRow } from '../../shared/entry-row';
import { formatDay, plural } from '../../shared/formatters';
import { RemoveEntriesController } from '../../shared/remove-entries.controller';
import { ToastService } from '../../shared/toast.service';

interface DayGroup {
  readonly key: string;
  readonly title: string;
  readonly entries: readonly SymptomEntry[];
}

const PAGE_SIZE = 14;

@Component({
  selector: 'app-history-page',
  imports: [EntryRow, RouterLink],
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
})
export default class HistoryPage {
  private readonly store = inject(JournalStore);
  private readonly backup = inject(JournalBackupUseCase);
  private readonly removal = inject(RemoveEntriesController);
  private readonly toasts = inject(ToastService);
  private readonly clock = inject(Clock);

  protected readonly visibleDays = signal(PAGE_SIZE);

  private readonly allDays = computed<DayGroup[]>(() => {
    const today = toDateKey(this.clock.now());
    const groups = new Map<string, SymptomEntry[]>();
    for (const entry of this.store.entries()) {
      const key = toDateKey(new Date(entry.occurredAt));
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    return [...groups].map(([key, entries]) => ({
      key,
      entries,
      title: key === today ? 'Hoje' : formatDay(fromDateKey(key)),
    }));
  });

  protected readonly days = computed(() => this.allDays().slice(0, this.visibleDays()));
  protected readonly hasMore = computed(() => this.allDays().length > this.visibleDays());
  protected readonly total = computed(() => this.store.entries().length);
  protected readonly count = (n: number) => plural(n, 'registro', 'registros');

  protected showMore(): void {
    this.visibleDays.update((n) => n + PAGE_SIZE);
  }

  protected remove(entry: SymptomEntry): void {
    this.removal.remove([entry]);
  }

  protected exportFile(): void {
    this.backup.export();
    this.toasts.show('Arquivo do diário baixado');
  }

  protected async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const result = await this.backup.import(file);
      this.toasts.show(
        result.addedEntries
          ? `${this.count(result.addedEntries)} importados`
          : 'Nenhum registro novo nesse arquivo',
      );
    } catch (e) {
      this.toasts.show((e as Error).message);
    }
  }
}
