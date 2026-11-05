import { CheckIcon, CopyIcon, StarIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { computeStats, findBestValues, STAT_DEFINITIONS } from '../lib/stats';
import type { Plan } from '../lib/types';
import { createPlan, duplicatePlan, selectComparedPlans, toggleChosen, toggleCompared, type PlansState } from '../state/plans';
import { Button } from './Button';
import { Grid } from './Grid';

interface CompareViewProps {
  state: PlansState;
}

interface PlanColumnProps {
  plan: Plan;
  chosen: boolean;
  stats: ReturnType<typeof computeStats>;
  best: ReturnType<typeof findBestValues>;
}

function PlanColumn({ plan, chosen, stats, best }: PlanColumnProps) {
  return (
    <section
      aria-label={plan.name}
      className="min-w-0 animate-fade-up rounded-2xl border border-line bg-surface p-3 shadow-card sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="truncate font-display text-base font-semibold">{plan.name}</h2>
        <Button
          variant="ghost"
          aria-pressed={chosen}
          onClick={() => toggleChosen(plan.id)}
          title={chosen ? 'Remove chosen mark' : 'Mark as the chosen plan'}
          icon={
            <StarIcon size={16} weight={chosen ? 'fill' : 'regular'} className={chosen ? 'text-accent' : undefined} />
          }
        >
          {chosen ? 'Chosen' : 'Choose'}
        </Button>
      </div>

      <div tabIndex={0} role="region" aria-label={`${plan.name} timetable, scrollable`} className="overflow-x-auto rounded-lg">
        <Grid label={`${plan.name} timetable`} courses={plan.courses} variant="compact" />
      </div>

      <dl className="mt-4 divide-y divide-line text-sm">
        {STAT_DEFINITIONS.map(({ key, label }) => {
          const isBest = best[key] === stats[key];
          return (
            <div key={key} className="flex items-center justify-between gap-3 py-1.5">
              <dt className="text-ink-soft">{label}</dt>
              <dd
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${
                  isBest ? 'bg-accent-soft text-accent-ink' : 'text-ink'
                }`}
              >
                {isBest ? (
                  <>
                    <CheckIcon size={12} weight="bold" aria-hidden="true" />
                    <span className="sr-only">Best: </span>
                  </>
                ) : null}
                {stats[key]}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function CompareView({ state }: CompareViewProps) {
  const compared = useMemo(() => selectComparedPlans(state), [state]);
  const comparedStats = useMemo(() => compared.map(computeStats), [compared]);
  const best = useMemo(() => findBestValues(comparedStats), [comparedStats]);

  if (state.plans.length < 2) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <h2 className="font-display text-lg font-semibold">Comparing needs two plans</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Duplicate your current plan to try a variation, or start another from empty.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="primary" icon={<CopyIcon size={16} />} onClick={() => duplicatePlan(state.activeId)}>
            Duplicate plan
          </Button>
          <Button onClick={createPlan}>New empty plan</Button>
        </div>
      </div>
    );
  }

  const selectedIds = new Set(compared.map((plan) => plan.id));

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Select 2 or 3 plans</legend>
        <div className="flex flex-wrap gap-2">
          {state.plans.map((plan) => {
            const selected = selectedIds.has(plan.id);
            const locked = selected ? compared.length <= 2 : compared.length >= 3;
            return (
              <label
                key={plan.id}
                className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent lg:h-9 ${
                  selected ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface text-ink-soft'
                } ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={locked}
                  onChange={() => toggleCompared(plan.id)}
                  className="size-4 accent-accent"
                />
                {plan.name}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={`grid gap-4 ${compared.length === 3 ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {compared.map((plan, index) => {
          const stats = comparedStats[index];
          if (!stats) return null;
          return (
            <PlanColumn key={plan.id} plan={plan} chosen={state.chosenId === plan.id} stats={stats} best={best} />
          );
        })}
      </div>
    </div>
  );
}
