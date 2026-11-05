import { DAY_NAMES, SLOTS, type SlotCode } from '../data/slots';
import { courseLabel, type Course } from '../lib/types';

export type GridVariant = 'full' | 'compact';

interface CellProps {
  code: SlotCode;
  course?: Course;
  variant: GridVariant;
  onSelect?: (course: Course) => void;
}

function shortLabel(course: Course): string {
  if (course.code) return course.code;
  return course.name
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 5);
}

function describeCell(code: SlotCode, course?: Course): string {
  const { day, startTime, endTime } = SLOTS[code];
  const when = `${DAY_NAMES[day]} ${startTime} to ${endTime}`;
  if (!course) return `${code}, free, ${when}`;
  const parts = [code, courseLabel(course)];
  if (course.code) parts.push(course.name);
  if (course.venue) parts.push(course.venue);
  return `${parts.join(', ')}, ${when}`;
}

export function Cell({ code, course, variant, onSelect }: CellProps) {
  const compact = variant === 'compact';

  if (!course) {
    return (
      <div
        aria-label={describeCell(code)}
        className={`flex h-full items-center justify-center rounded-lg bg-sunken text-ink-faint ${
          compact ? 'text-[10px]' : 'text-xs'
        }`}
      >
        {code}
      </div>
    );
  }

  const content = compact ? (
    <span className="text-[10px] leading-tight font-semibold tracking-tight [overflow-wrap:anywhere]">
      {shortLabel(course)}
    </span>
  ) : (
    <>
      <span className="text-xs leading-tight opacity-85">{code}</span>
      <span className="line-clamp-2 text-[13px] leading-tight font-semibold [overflow-wrap:anywhere]">
        {course.code || course.name}
      </span>
      {course.venue ? <span className="text-xs leading-tight [overflow-wrap:anywhere]">{course.venue}</span> : null}
    </>
  );

  const shape = `tint-fill flex h-full w-full animate-cell-fill rounded-lg ${
    compact ? 'items-center justify-center p-px text-center' : 'flex-col justify-center gap-0.5 p-1.5 text-left lg:p-2'
  }`;

  if (!onSelect) {
    return (
      <div data-tint={course.tint} aria-label={describeCell(code, course)} title={course.name} className={shape}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-tint={course.tint}
      aria-label={`Edit ${describeCell(code, course)}`}
      title={course.name}
      onClick={() => onSelect(course)}
      className={`${shape} transition duration-150 ease-out hover:brightness-95 focus-visible:outline-offset-[-2px] active:scale-[0.98]`}
    >
      {content}
    </button>
  );
}
