import type { AppConfig } from '@/types';

const CENTS_PER_UNIT = 100;
// Groups digits in lakh and crore, as used in Bangladesh: ৳1,23,456.00
const NUMBER_LOCALE = 'en-IN';
const DATE_LOCALE = 'en-GB';
const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

export interface Formatters {
  // Money travels as integer cents (paisa). Only for showing it, never for calculating.
  money: (cents: number) => string;
  // A whole number of things, e.g. sales
  count: (value: number) => string;
  // Days and times are those of the business, whatever the clock of this computer says
  date: (moment: string | Date) => string;
  dateTime: (moment: string | Date) => string;
}

export function newFormatters({ currency, timezone }: Pick<AppConfig, 'currency' | 'timezone'>): Formatters {
  const money = new Intl.NumberFormat(NUMBER_LOCALE, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
  const whole = new Intl.NumberFormat(NUMBER_LOCALE);
  const date = new Intl.DateTimeFormat(DATE_LOCALE, { ...DAY, timeZone: timezone });
  const dateTime = new Intl.DateTimeFormat(DATE_LOCALE, {
    ...DAY,
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  return {
    money: (cents) => money.format(cents / CENTS_PER_UNIT),
    count: (value) => whole.format(value),
    date: (moment) => date.format(new Date(moment)),
    dateTime: (moment) => dateTime.format(new Date(moment))
  };
}
