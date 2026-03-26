import { Priority } from '../types';
import { isToday, isBefore, startOfDay } from 'date-fns';

export const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.Urgent: return 'bg-red-500';
    case Priority.High: return 'bg-orange-500';
    case Priority.Medium: return 'bg-yellow-500';
    case Priority.Low: return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

export const isTaskUrgent = (date: Date, priority: Priority): boolean => {
  const today = startOfDay(new Date());
  return isToday(date) || isBefore(date, today) || priority === Priority.Urgent;
};