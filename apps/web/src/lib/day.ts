// A calendar day as the API writes it, YYYY-MM-DD: no clock and no time zone
export type Day = string;

const pad = (value: number) => String(value).padStart(2, '0');

// The Date a calendar shows for a day: midnight on this computer
export function dateOf(day: Day): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

export const dayOf = (date: Date): Day => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Today where the business is, wherever this computer thinks it is
export const todayIn = (timeZone: string, now = new Date()): Day =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
