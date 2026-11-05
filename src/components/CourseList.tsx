import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { courseLabel, totalCredits, type Course } from '../lib/types';
import { Button } from './Button';

interface CourseListProps {
  courses: readonly Course[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}

export function CourseList({ courses, onEdit, onDelete }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <p className="rounded-xl bg-sunken px-4 py-6 text-center text-sm leading-relaxed text-ink-soft">
        No courses yet. Add one above and it will appear on the timetable.
      </p>
    );
  }

  return (
    <div>
      <ul className="-mx-2 space-y-1">
        {courses.map((course) => (
          <li key={course.id} className="flex animate-fade-up items-start gap-1 rounded-xl hover:bg-sunken">
            <button
              type="button"
              onClick={() => onEdit(course)}
              aria-label={`Edit ${courseLabel(course)}, ${course.name}`}
              className="flex min-w-0 flex-1 gap-2.5 rounded-xl p-2 text-left"
            >
              <span
                data-tint={course.tint}
                aria-hidden="true"
                className="tint-dot mt-1.5 size-2.5 shrink-0 rounded-full"
              />
              <span className="min-w-0">
                <span className="block text-sm leading-snug font-semibold [overflow-wrap:anywhere]">
                  {course.code ? `${course.code} · ` : ''}
                  {course.name}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft [overflow-wrap:anywhere]">
                  {[course.slots.join('+'), course.venue, course.faculty].filter(Boolean).join(' · ')}
                </span>
                {course.credits !== null ? (
                  <span className="block text-xs leading-relaxed text-ink-soft">
                    {course.credits} {course.credits === 1 ? 'credit' : 'credits'}
                  </span>
                ) : null}
              </span>
            </button>
            <div className="flex shrink-0 py-0.5 pr-0.5">
              <Button
                variant="ghost"
                onClick={() => onEdit(course)}
                aria-label={`Edit ${courseLabel(course)}`}
                title="Edit"
                icon={<PencilSimpleIcon size={16} />}
              />
              <Button
                variant="ghost"
                onClick={() => onDelete(course)}
                aria-label={`Delete ${courseLabel(course)}`}
                title="Delete"
                icon={<TrashIcon size={16} />}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-sm text-ink-soft">Total credits</span>
        <span className="font-display text-xl font-semibold">{totalCredits(courses)}</span>
      </div>
    </div>
  );
}
