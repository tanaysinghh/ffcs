import { forwardRef } from 'react';
import { totalCredits, type Plan } from '../lib/types';
import { Grid } from './Grid';

interface ExportSheetProps {
  plan: Plan;
}

export const ExportSheet = forwardRef<HTMLDivElement, ExportSheetProps>(function ExportSheet({ plan }, ref) {
  const credits = totalCredits(plan.courses);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed top-0 left-[-10000px]">
      <div ref={ref} className="theme-light no-motion w-[1120px] bg-surface p-8 font-sans text-ink">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
          <p className="text-sm text-ink-soft">
            {plan.courses.length} {plan.courses.length === 1 ? 'course' : 'courses'} · {credits}{' '}
            {credits === 1 ? 'credit' : 'credits'}
          </p>
        </div>
        <Grid label={`${plan.name} timetable`} courses={plan.courses} />
        {plan.courses.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 border-t border-line pt-5">
            {plan.courses.map((course) => (
              <li key={course.id} className="flex gap-2.5 text-xs leading-relaxed">
                <span data-tint={course.tint} className="tint-dot mt-1 size-2.5 shrink-0 rounded-full" />
                <span>
                  <span className="font-semibold">
                    {course.code ? `${course.code} · ` : ''}
                    {course.name}
                  </span>
                  <span className="block text-ink-soft">
                    {[
                      course.slots.join('+'),
                      course.venue,
                      course.credits === null ? '' : `${course.credits} ${course.credits === 1 ? 'credit' : 'credits'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
});
