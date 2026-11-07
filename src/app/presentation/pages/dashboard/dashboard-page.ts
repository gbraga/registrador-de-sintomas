import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JournalStore } from '../../../application/journal.store';
import { findRegion } from '../../../domain/models/body-region';
import { addDays, fromDateKey, startOfDay, toDateKey } from '../../../domain/models/date-key';
import { DAY_PERIODS, DayPeriodId } from '../../../domain/models/day-period';
import { INTENSITY_LEVELS, intensityLabel } from '../../../domain/models/intensity';
import { Clock } from '../../../domain/ports/clock';
import {
  MatchMode,
  byDayPeriod,
  byHour,
  byRegion,
  bySymptom,
  entriesBetween,
  matchingDays,
} from '../../../domain/statistics/symptom-statistics';
import { formatDay, formatShortDay } from '../../shared/formatters';

interface CalendarCell {
  readonly key: string;
  readonly inRange: boolean;
  readonly level: number;
  readonly label: string;
}

const RANGES = [7, 30, 90] as const;
type RangeDays = (typeof RANGES)[number];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const FILTER_PREVIEW = 6;
const PERIOD_PHRASE: Record<DayPeriodId, string> = {
  dawn: 'de madrugada',
  morning: 'pela manhã',
  afternoon: 'à tarde',
  night: 'à noite',
};

const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
const decimal = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function joinNames(names: readonly string[], conjunction: 'e' | 'ou'): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${conjunction} ${names.at(-1)}`;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export default class DashboardPage {
  private readonly store = inject(JournalStore);
  private readonly clock = inject(Clock);

  protected readonly ranges = RANGES;
  protected readonly weekdays = WEEKDAYS;
  protected readonly levels = INTENSITY_LEVELS;
  protected readonly levelLabel = intensityLabel;
  protected readonly decimal = decimal;

  protected readonly rangeDays = signal<RangeDays>(30);
  protected readonly selectedSymptoms = signal<readonly string[]>([]);
  protected readonly matchMode = signal<MatchMode>('any');
  protected readonly showAllFilters = signal(false);

  private readonly today = startOfDay(this.clock.now());
  private readonly from = computed(() => addDays(this.today, -(this.rangeDays() - 1)));
  protected readonly entries = computed(() =>
    entriesBetween(this.store.entries(), this.from(), this.today),
  );

  // ---- Dias com sintomas ----

  protected readonly symptomOptions = computed(() => {
    const tallies = bySymptom(this.entries());
    const ids = new Set([...tallies.map((t) => t.symptomId), ...this.selectedSymptoms()]);
    return [...ids].map((id) => ({ id, name: this.store.symptomName(id) }));
  });
  protected readonly visibleOptions = computed(() =>
    this.showAllFilters() ? this.symptomOptions() : this.symptomOptions().slice(0, FILTER_PREVIEW),
  );
  protected readonly hiddenOptionCount = computed(
    () => this.symptomOptions().length - this.visibleOptions().length,
  );

  protected readonly days = computed(() =>
    matchingDays(this.entries(), this.selectedSymptoms(), this.matchMode()),
  );

  protected readonly daysSentence = computed(() => {
    const count = this.days().length;
    const total = this.rangeDays();
    const names = this.selectedSymptoms().map((id) => this.store.symptomName(id).toLowerCase());
    const span = `${count} dos últimos ${total} dias`;
    if (!names.length) return `Você registrou sintomas em ${span}.`;
    if (names.length === 1)
      return `${names[0]} apareceu em ${span}.`.replace(/^./, (c) => c.toUpperCase());
    return this.matchMode() === 'all'
      ? `${joinNames(names, 'e')} vieram juntos em ${span}.`.replace(/^./, (c) => c.toUpperCase())
      : `Pelo menos um deles apareceu em ${span}.`;
  });

  protected readonly calendar = computed<CalendarCell[]>(() => {
    const from = this.from();
    const levels = new Map(this.days().map((d) => [d.dateKey, d.maxIntensity]));
    const lead = from.getDay();
    const cells: CalendarCell[] = Array.from({ length: lead }, (_, i) => ({
      key: `pad-${i}`,
      inRange: false,
      level: 0,
      label: '',
    }));
    for (let i = 0; i < this.rangeDays(); i++) {
      const date = addDays(from, i);
      const key = toDateKey(date);
      const level = levels.get(key) ?? 0;
      cells.push({
        key,
        inRange: true,
        level,
        label: `${formatDay(date)}: ${level ? `intensidade máxima ${level}, ${intensityLabel(level as 1).toLowerCase()}` : 'sem registro'}`,
      });
    }
    return cells;
  });

  protected readonly calendarStart = computed(() => formatShortDay(this.from()));
  protected readonly calendarEnd = formatShortDay(this.today);

  // ---- Momento do dia ----

  protected readonly periods = computed(() => {
    const tallies = byDayPeriod(this.entries());
    const max = Math.max(1, ...tallies.map((t) => t.count));
    return tallies.map((t) => ({
      ...t,
      name: DAY_PERIODS.find((p) => p.id === t.periodId)!.name,
      share: t.count / max,
    }));
  });

  protected readonly hours = computed(() => {
    const counts = byHour(this.entries());
    const max = Math.max(1, ...counts);
    return counts.map((count, hour) => ({ hour, count, share: count / max }));
  });

  protected readonly periodSentence = computed(() => {
    const total = this.entries().length;
    const top = [...this.periods()].sort((a, b) => b.count - a.count)[0];
    if (!total || !top) return '';
    const period = DAY_PERIODS.find((p) => p.id === top.periodId)!;
    const peak = this.hours()
      .filter((h) => h.hour >= period.startHour && h.hour < period.endHour)
      .sort((a, b) => b.count - a.count)[0];
    return `Você sente mais ${PERIOD_PHRASE[top.periodId]}: ${percent(top.count, total)}% dos registros, com pico por volta das ${peak.hour}h.`;
  });

  // ---- Regiões ----

  protected readonly regions = computed(() => {
    const tallies = byRegion(this.entries()).filter((t) => t.count > 0);
    const max = Math.max(1, ...tallies.map((t) => t.count));
    return tallies.map((t) => ({ ...t, name: findRegion(t.regionId).name, share: t.count / max }));
  });

  protected readonly regionSentence = computed(() => {
    const [top] = this.regions();
    if (!top) return '';
    return `${top.name} concentra ${percent(top.count, this.entries().length)}% dos registros, com intensidade média ${decimal(top.averageIntensity)}.`;
  });

  // ---- Sintomas ----

  protected readonly topSymptoms = computed(() => {
    const tallies = bySymptom(this.entries()).slice(0, 8);
    const max = Math.max(1, ...tallies.map((t) => t.days));
    return tallies.map((t) => ({
      ...t,
      name: this.store.symptomName(t.symptomId),
      share: t.days / max,
    }));
  });

  // ---- Ações ----

  protected toggleSymptom(id: string): void {
    this.selectedSymptoms.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  protected isSelected(id: string): boolean {
    return this.selectedSymptoms().includes(id);
  }

  protected clearSymptoms(): void {
    this.selectedSymptoms.set([]);
  }

  protected rangeLabel(days: number): string {
    return `${days} dias`;
  }

  protected dayLabel(key: string): string {
    return formatShortDay(fromDateKey(key));
  }
}
