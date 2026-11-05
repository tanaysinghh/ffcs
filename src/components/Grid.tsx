import { useMemo } from 'react';
import { COLUMNS, DAYS, DAY_NAMES, GRID_LAYOUT, type Day, type SlotCode } from '../data/slots';
import type { Course } from '../lib/types';
import { Cell, type GridVariant } from './Cell';

interface GridProps {
  label: string;
  courses: readonly Course[];
  variant?: GridVariant;
  today?: Day | null;
  onSelect?: (course: Course) => void;
}

const VARIANT_LAYOUT: Record<GridVariant, { columns: string; minWidth: number; minRowHeight: string; stickyEdge: string }> = {
  full: {
    columns: '56px repeat(3, minmax(96px, 1fr)) 28px repeat(4, minmax(96px, 1fr))',
    minWidth: 788,
    minRowHeight: '84px',
    stickyEdge: 'shadow-[4px_0_0_var(--surface),0_4px_0_var(--surface),4px_4px_0_var(--surface)]',
  },
  compact: {
    columns: '36px repeat(3, minmax(49px, 1fr)) 14px repeat(4, minmax(49px, 1fr))',
    minWidth: 409,
    minRowHeight: '44px',
    stickyEdge: 'shadow-[2px_0_0_var(--surface),0_2px_0_var(--surface),2px_2px_0_var(--surface)]',
  },
};

export function Grid({ label, courses, variant = 'full', today = null, onSelect }: GridProps) {
  const compact = variant === 'compact';
  const layout = VARIANT_LAYOUT[variant];

  const courseBySlot = useMemo(() => {
    const map = new Map<SlotCode, Course>();
    for (const course of courses) {
      for (const slot of course.slots) map.set(slot, course);
    }
    return map;
  }, [courses]);

  return (
    <div
      role="table"
      aria-label={label}
      className={`grid ${compact ? 'gap-0.5' : 'gap-1'}`}
      style={{
        gridTemplateColumns: layout.columns,
        gridTemplateRows: `auto repeat(${DAYS.length}, minmax(${layout.minRowHeight}, auto))`,
        minWidth: layout.minWidth,
      }}
    >
      <div role="row" className="contents">
        <div
          role="columnheader"
          aria-label="Day"
          className={`sticky left-0 z-10 bg-surface ${layout.stickyEdge}`}
          style={{ gridColumn: 1, gridRow: 1 }}
        />
        {COLUMNS.map((column, columnIndex) =>
          column.kind === 'lunch' ? (
            <div
              key="lunch"
              role="columnheader"
              aria-label="Lunch"
              style={{ gridColumn: columnIndex + 2, gridRow: 1 }}
            />
          ) : (
            <div
              key={column.startTime}
              role="columnheader"
              aria-label={`${column.startTime} to ${column.endTime}`}
              className={`pb-1 text-center font-medium whitespace-nowrap text-ink-soft ${
                compact ? 'text-[10px]' : 'text-xs'
              }`}
              style={{ gridColumn: columnIndex + 2, gridRow: 1 }}
            >
              {compact ? column.startTime : `${column.startTime}–${column.endTime}`}
            </div>
          ),
        )}
      </div>

      {DAYS.map((day, dayIndex) => {
        const isToday = day === today;
        const gridRow = dayIndex + 2;
        return (
          <div key={day} role="row" className="contents">
            <div
              role="rowheader"
              aria-label={`${DAY_NAMES[day]}${isToday ? ', today' : ''}`}
              className={`sticky left-0 z-10 bg-surface ${layout.stickyEdge}`}
              style={{ gridColumn: 1, gridRow }}
            >
              <div
                className={`flex h-full items-center justify-center rounded-lg font-semibold tracking-wide ${
                  compact ? 'text-[10px]' : 'text-xs'
                } ${isToday ? 'bg-accent-soft text-accent-ink' : 'text-ink-soft'}`}
              >
                {day}
              </div>
            </div>
            {GRID_LAYOUT[day].map((code, columnIndex) => {
              const gridColumn = columnIndex + 2;
              if (code === null) {
                if (dayIndex !== 0) return null;
                return (
                  <div
                    key="lunch"
                    role="cell"
                    aria-rowspan={DAYS.length}
                    aria-label="Lunch break"
                    className="lunch-fill flex items-center justify-center rounded-lg"
                    style={{ gridColumn, gridRow: `${gridRow} / span ${DAYS.length}` }}
                  >
                    {compact ? null : (
                      <span className="text-[11px] font-medium tracking-[0.2em] text-ink-soft uppercase [writing-mode:vertical-rl]">
                        Lunch
                      </span>
                    )}
                  </div>
                );
              }
              const course = courseBySlot.get(code);
              return (
                <div key={code} role="cell" style={{ gridColumn, gridRow }}>
                  <Cell
                    key={course?.id ?? 'empty'}
                    code={code}
                    course={course}
                    variant={variant}
                    isToday={isToday}
                    onSelect={onSelect}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
