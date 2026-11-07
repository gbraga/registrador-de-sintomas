import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JournalStore } from '../../../application/journal.store';
import { RemoveEntriesUseCase } from '../../../application/use-cases/remove-entries.use-case';
import { BODY_REGIONS, BodyRegionId, findRegion } from '../../../domain/models/body-region';
import { toDateKey } from '../../../domain/models/date-key';
import { SymptomEntry } from '../../../domain/models/symptom-entry';
import { Clock } from '../../../domain/ports/clock';
import { heatByRegion } from '../../../domain/statistics/symptom-statistics';
import { BodyModel } from '../../components/body-model/body-model';
import { SymptomSheet } from '../../components/symptom-sheet/symptom-sheet';
import { EntryRow } from '../../shared/entry-row';
import { formatDay, plural } from '../../shared/formatters';
import { RemoveEntriesController } from '../../shared/remove-entries.controller';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-record-page',
  imports: [BodyModel, SymptomSheet, EntryRow, RouterLink],
  templateUrl: './record-page.html',
  styleUrl: './record-page.scss',
})
export default class RecordPage {
  private readonly store = inject(JournalStore);
  private readonly clock = inject(Clock);
  private readonly toasts = inject(ToastService);
  private readonly removeEntries = inject(RemoveEntriesUseCase);
  private readonly removal = inject(RemoveEntriesController);
  private readonly bodyModel = viewChild(BodyModel);

  protected readonly regions = BODY_REGIONS;
  protected readonly today = formatDay(this.clock.now());
  protected readonly selectedId = signal<BodyRegionId | null>(null);
  protected readonly selectedRegion = computed(() => {
    const id = this.selectedId();
    return id ? findRegion(id) : null;
  });

  protected readonly todayEntries = computed(() => {
    const key = toDateKey(this.clock.now());
    return this.store.entries().filter((e) => toDateKey(new Date(e.occurredAt)) === key);
  });
  protected readonly heat = computed(() => heatByRegion(this.todayEntries()));
  protected readonly todaySummary = computed(() =>
    plural(this.todayEntries().length, 'registro hoje', 'registros hoje'),
  );

  protected select(region: BodyRegionId): void {
    this.selectedId.set(this.selectedId() === region ? null : region);
  }

  protected close(): void {
    const region = this.selectedId();
    this.selectedId.set(null);
    if (region) queueMicrotask(() => document.getElementById(`region-${region}`)?.focus());
  }

  protected onRecorded(entries: SymptomEntry[]): void {
    const region = this.selectedId();
    this.selectedId.set(null);
    if (region) this.bodyModel()?.flash(region);
    this.toasts.show(
      entries.length === 1 ? 'Sintoma registrado' : `${entries.length} sintomas registrados`,
      {
        actionLabel: 'Desfazer',
        action: () => this.removeEntries.execute(entries.map((e) => e.id)),
      },
    );
  }

  protected remove(entry: SymptomEntry): void {
    this.removal.remove([entry]);
  }
}
