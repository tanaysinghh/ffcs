export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export type Day = (typeof DAYS)[number];

export const DAY_NAMES: Record<Day, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

export const LUNCH_COLUMN_INDEX = 3;

export type GridColumn = { kind: 'slot'; startTime: string; endTime: string } | { kind: 'lunch' };

export const COLUMNS: readonly GridColumn[] = [
  { kind: 'slot', startTime: '08:30', endTime: '10:00' },
  { kind: 'slot', startTime: '10:05', endTime: '11:35' },
  { kind: 'slot', startTime: '11:40', endTime: '13:10' },
  { kind: 'lunch' },
  { kind: 'slot', startTime: '13:15', endTime: '14:45' },
  { kind: 'slot', startTime: '14:50', endTime: '16:20' },
  { kind: 'slot', startTime: '16:25', endTime: '17:55' },
  { kind: 'slot', startTime: '18:00', endTime: '19:30' },
];

export const GRID_LAYOUT = {
  MON: ['A11', 'B11', 'C11', null, 'A21', 'A14', 'B21', 'C21'],
  TUE: ['D11', 'E11', 'F11', null, 'D21', 'E14', 'E21', 'F21'],
  WED: ['A12', 'B12', 'C12', null, 'A22', 'B14', 'B22', 'A24'],
  THU: ['D12', 'E12', 'F12', null, 'D22', 'F14', 'E22', 'F22'],
  FRI: ['A13', 'B13', 'C13', null, 'A23', 'C14', 'B23', 'B24'],
  SAT: ['D13', 'E13', 'F13', null, 'D23', 'D14', 'D24', 'E23'],
} as const;

export type SlotCode = Exclude<(typeof GRID_LAYOUT)[Day][number], null>;

export interface SlotInfo {
  day: Day;
  columnIndex: number;
  startTime: string;
  endTime: string;
}

export const SLOTS = Object.fromEntries(
  DAYS.flatMap((day) =>
    GRID_LAYOUT[day].flatMap((code, columnIndex) => {
      const column = COLUMNS[columnIndex];
      if (code === null || column?.kind !== 'slot') return [];
      const info: SlotInfo = { day, columnIndex, startTime: column.startTime, endTime: column.endTime };
      return [[code, info]];
    }),
  ),
) as Record<SlotCode, SlotInfo>;

export function isSlotCode(value: string): value is SlotCode {
  return Object.hasOwn(SLOTS, value);
}

export function getToday(date: Date = new Date()): Day | null {
  return DAYS[date.getDay() - 1] ?? null;
}
