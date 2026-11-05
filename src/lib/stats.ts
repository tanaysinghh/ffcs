import { DAYS, SLOTS } from '../data/slots';
import { totalCredits, type Plan } from './types';

export interface PlanStats {
  credits: number;
  courses: number;
  earlyClasses: number;
  lateClasses: number;
  freeDays: number;
  saturdayClasses: number;
}

export type StatKey = keyof PlanStats;

export const STAT_DEFINITIONS: readonly { key: StatKey; label: string; best: 'high' | 'low' }[] = [
  { key: 'credits', label: 'Total credits', best: 'high' },
  { key: 'courses', label: 'Courses', best: 'high' },
  { key: 'earlyClasses', label: '08:30 classes', best: 'low' },
  { key: 'lateClasses', label: 'Classes from 16:25', best: 'low' },
  { key: 'freeDays', label: 'Days with no class', best: 'high' },
  { key: 'saturdayClasses', label: 'Saturday classes', best: 'low' },
];

export function computeStats(plan: Plan): PlanStats {
  const slots = plan.courses.flatMap((course) => course.slots).map((code) => SLOTS[code]);
  const busyDays = new Set(slots.map((slot) => slot.day));
  return {
    credits: totalCredits(plan.courses),
    courses: plan.courses.length,
    earlyClasses: slots.filter((slot) => slot.startTime === '08:30').length,
    lateClasses: slots.filter((slot) => slot.startTime >= '16:25').length,
    freeDays: DAYS.length - busyDays.size,
    saturdayClasses: slots.filter((slot) => slot.day === 'SAT').length,
  };
}

export function findBestValues(stats: readonly PlanStats[]): Partial<Record<StatKey, number>> {
  const candidates = stats.filter((entry) => entry.courses > 0);
  if (candidates.length < 2) return {};

  const best: Partial<Record<StatKey, number>> = {};
  for (const { key, best: direction } of STAT_DEFINITIONS) {
    const values = candidates.map((entry) => entry[key]);
    const top = direction === 'high' ? Math.max(...values) : Math.min(...values);
    if (values.some((value) => value !== top)) best[key] = top;
  }
  return best;
}
