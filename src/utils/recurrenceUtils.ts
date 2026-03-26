import { Recurrence } from '../types';

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addWeeks = (date: Date, weeks: number): Date => addDays(date, weeks * 7);

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // handle month overflows (e.g., Jan 31 + 1m -> Feb 28/29)
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
};

export const generateRecurrenceDates = (recurrence: Recurrence): Date[] => {
  const dates: Date[] = [];

  if (!recurrence || recurrence.from > recurrence.to) return dates;

  let current = new Date(recurrence.from);

  while (current <= recurrence.to) {
    dates.push(new Date(current));

    switch (recurrence.frequency) {
      case 'daily':
        current = addDays(current, 1);
        break;
      case 'weekly':
        current = addWeeks(current, 1);
        break;
      case 'monthly':
        current = addMonths(current, 1);
        break;
      default:
        return dates;
    }
  }

  return dates;
};
