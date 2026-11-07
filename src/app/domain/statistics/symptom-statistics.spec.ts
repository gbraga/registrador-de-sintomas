import { SymptomEntry } from '../models/symptom-entry';
import { byDayPeriod, byRegion, matchingDays } from './symptom-statistics';

const entry = (symptomId: string, iso: string, intensity: 1 | 2 | 3 | 4 | 5 = 3): SymptomEntry => ({
  id: `${symptomId}-${iso}`,
  symptomId,
  regionId: symptomId === 'headache' ? 'head' : 'whole-body',
  intensity,
  occurredAt: new Date(iso).toISOString(),
  recordedAt: new Date(iso).toISOString(),
});

describe('symptom statistics', () => {
  const entries = [
    entry('fatigue', '2026-11-01T08:00:00', 2),
    entry('headache', '2026-11-01T15:00:00', 4),
    entry('fatigue', '2026-11-02T21:00:00', 3),
    entry('headache', '2026-11-03T14:00:00', 5),
  ];

  it('finds days with any of the chosen symptoms', () => {
    expect(matchingDays(entries, ['fatigue', 'headache'], 'any').map((d) => d.dateKey)).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ]);
  });

  it('finds days where all chosen symptoms happened together', () => {
    const days = matchingDays(entries, ['fatigue', 'headache'], 'all');
    expect(days).toEqual([{ dateKey: '2026-11-01', count: 2, maxIntensity: 4 }]);
  });

  it('counts entries by period of the day', () => {
    const counts = Object.fromEntries(byDayPeriod(entries).map((p) => [p.periodId, p.count]));
    expect(counts).toEqual({ dawn: 0, morning: 1, afternoon: 2, night: 1 });
  });

  it('ranks the most affected region first', () => {
    const [top] = byRegion([...entries, entry('headache', '2026-11-04T10:00:00')]);
    expect(top.regionId).toBe('head');
    expect(top.count).toBe(3);
  });
});
