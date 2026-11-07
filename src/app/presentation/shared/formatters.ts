const dayFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const shortDayFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const formatDay = (date: Date): string => capitalize(dayFormat.format(date));
export const formatShortDay = (date: Date): string => shortDayFormat.format(date).replace('.', '');
export const formatTime = (date: Date): string => timeFormat.format(date);

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
