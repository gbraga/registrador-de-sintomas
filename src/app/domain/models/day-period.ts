export type DayPeriodId = 'dawn' | 'morning' | 'afternoon' | 'night';

export interface DayPeriod {
  readonly id: DayPeriodId;
  readonly name: string;
  readonly startHour: number;
  readonly endHour: number;
}

export const DAY_PERIODS: readonly DayPeriod[] = [
  { id: 'dawn', name: 'Madrugada', startHour: 0, endHour: 6 },
  { id: 'morning', name: 'Manhã', startHour: 6, endHour: 12 },
  { id: 'afternoon', name: 'Tarde', startHour: 12, endHour: 18 },
  { id: 'night', name: 'Noite', startHour: 18, endHour: 24 },
];

export function periodOf(date: Date): DayPeriod {
  const hour = date.getHours();
  return DAY_PERIODS.find((p) => hour >= p.startHour && hour < p.endHour) ?? DAY_PERIODS[0];
}
