import { BODY_REGIONS, BodyRegionId } from '../models/body-region';
import { DateKey, addDays, toDateKey } from '../models/date-key';
import { DAY_PERIODS, DayPeriodId, periodOf } from '../models/day-period';
import { SymptomEntry } from '../models/symptom-entry';

export type MatchMode = 'any' | 'all';

export interface Tally {
  readonly count: number;
  readonly averageIntensity: number;
}

export interface PeriodTally extends Tally {
  readonly periodId: DayPeriodId;
}

export interface RegionTally extends Tally {
  readonly regionId: BodyRegionId;
}

export interface SymptomTally extends Tally {
  readonly symptomId: string;
  readonly days: number;
}

export interface DayTally {
  readonly dateKey: DateKey;
  readonly count: number;
  readonly maxIntensity: number;
}

const average = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

function groupBy<K, T>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

const tally = (entries: readonly SymptomEntry[]): Tally => ({
  count: entries.length,
  averageIntensity: average(entries.map((e) => e.intensity)),
});

const dayOf = (entry: SymptomEntry): DateKey => toDateKey(new Date(entry.occurredAt));

/** Registros cujo momento está entre o início de `from` e o fim de `to` (inclusive). */
export function entriesBetween(
  entries: readonly SymptomEntry[],
  from: Date,
  to: Date,
): SymptomEntry[] {
  const start = toDateKey(from);
  const end = toDateKey(to);
  return entries.filter((e) => {
    const key = dayOf(e);
    return key >= start && key <= end;
  });
}

/**
 * Dias em que os sintomas escolhidos ocorreram.
 * - `any`: basta um dos sintomas no dia.
 * - `all`: todos os sintomas precisam aparecer no mesmo dia.
 * Sem sintomas escolhidos, considera qualquer registro.
 */
export function matchingDays(
  entries: readonly SymptomEntry[],
  symptomIds: readonly string[],
  mode: MatchMode,
): DayTally[] {
  const selected = new Set(symptomIds);
  const relevant = selected.size ? entries.filter((e) => selected.has(e.symptomId)) : entries;

  return [...groupBy(relevant, dayOf)]
    .filter(([, dayEntries]) => {
      if (mode === 'any' || selected.size === 0) return true;
      const present = new Set(dayEntries.map((e) => e.symptomId));
      return [...selected].every((id) => present.has(id));
    })
    .map(([dateKey, dayEntries]) => ({
      dateKey,
      count: dayEntries.length,
      maxIntensity: Math.max(...dayEntries.map((e) => e.intensity)),
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function byDayPeriod(entries: readonly SymptomEntry[]): PeriodTally[] {
  const groups = groupBy(entries, (e) => periodOf(new Date(e.occurredAt)).id);
  return DAY_PERIODS.map((p) => ({ periodId: p.id, ...tally(groups.get(p.id) ?? []) }));
}

export function byHour(entries: readonly SymptomEntry[]): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  for (const e of entries) hours[new Date(e.occurredAt).getHours()]++;
  return hours;
}

export function byRegion(entries: readonly SymptomEntry[]): RegionTally[] {
  const groups = groupBy(entries, (e) => e.regionId);
  return BODY_REGIONS.map((r) => ({ regionId: r.id, ...tally(groups.get(r.id) ?? []) })).sort(
    (a, b) => b.count - a.count || b.averageIntensity - a.averageIntensity,
  );
}

export function bySymptom(entries: readonly SymptomEntry[]): SymptomTally[] {
  return [...groupBy(entries, (e) => e.symptomId)]
    .map(([symptomId, list]) => ({
      symptomId,
      days: new Set(list.map(dayOf)).size,
      ...tally(list),
    }))
    .sort((a, b) => b.count - a.count || b.averageIntensity - a.averageIntensity);
}

/** Série diária contínua (inclui dias sem registro) começando em `from`. */
export function dailySeries(
  entries: readonly SymptomEntry[],
  from: Date,
  days: number,
): DayTally[] {
  const groups = groupBy(entries, dayOf);
  return Array.from({ length: days }, (_, i) => {
    const dateKey = toDateKey(addDays(from, i));
    const list = groups.get(dateKey) ?? [];
    return {
      dateKey,
      count: list.length,
      maxIntensity: list.length ? Math.max(...list.map((e) => e.intensity)) : 0,
    };
  });
}

/** Maior intensidade registrada por região — usada para "aquecer" o corpo. */
export function heatByRegion(
  entries: readonly SymptomEntry[],
): Partial<Record<BodyRegionId, number>> {
  const heat: Partial<Record<BodyRegionId, number>> = {};
  for (const e of entries) heat[e.regionId] = Math.max(heat[e.regionId] ?? 0, e.intensity);
  return heat;
}
