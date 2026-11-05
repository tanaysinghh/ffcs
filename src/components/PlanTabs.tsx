import { CopyIcon, PencilSimpleIcon, PlusIcon, StarIcon, TrashIcon } from '@phosphor-icons/react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import type { Plan } from '../lib/types';
import { createPlan, duplicatePlan, renamePlan, setActivePlan, toggleChosen } from '../state/plans';
import { Button } from './Button';

interface PlanTabsProps {
  plans: readonly Plan[];
  activeId: string;
  chosenId: string | null;
  onDelete: (plan: Plan) => void;
}

const MAX_NAME_LENGTH = 24;

function tabId(planId: string): string {
  return `plan-tab-${planId}`;
}

function focusTab(planId: string): void {
  document.getElementById(tabId(planId))?.focus();
}

export function PlanTabs({ plans, activeId, chosenId, onDelete }: PlanTabsProps) {
  const [draftName, setDraftName] = useState<string | null>(null);
  const cancelled = useRef(false);
  const active = plans.find((plan) => plan.id === activeId);
  const isChosen = chosenId === activeId;

  const startRename = () => {
    if (!active) return;
    cancelled.current = false;
    setDraftName(active.name);
  };

  const finishRename = (save: boolean, restoreFocus: boolean) => {
    if (save && draftName !== null) renamePlan(activeId, draftName.slice(0, MAX_NAME_LENGTH));
    flushSync(() => setDraftName(null));
    if (restoreFocus) focusTab(activeId);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = plans.findIndex((plan) => plan.id === activeId);
    const targets: Record<string, number> = {
      ArrowRight: (index + 1) % plans.length,
      ArrowLeft: (index - 1 + plans.length) % plans.length,
      Home: 0,
      End: plans.length - 1,
    };
    const next = plans[targets[event.key] ?? -1];
    if (!next) return;
    event.preventDefault();
    flushSync(() => setActivePlan(next.id));
    focusTab(next.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Plans"
          onKeyDown={draftName === null ? handleTabKeyDown : undefined}
          className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl bg-sunken p-1"
        >
          {plans.map((plan) => {
            const selected = plan.id === activeId;
            if (selected && draftName !== null) {
              return (
                <input
                  key={plan.id}
                  autoFocus
                  aria-label="Plan name"
                  value={draftName}
                  maxLength={MAX_NAME_LENGTH}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={() => {
                    if (!cancelled.current) finishRename(true, false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      cancelled.current = true;
                      finishRename(true, true);
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      cancelled.current = true;
                      finishRename(false, true);
                    }
                  }}
                  className="h-9 w-36 shrink-0 rounded-lg border border-accent bg-surface px-2.5 text-base text-ink sm:h-8 sm:text-sm"
                />
              );
            }
            return (
              <button
                key={plan.id}
                id={tabId(plan.id)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="plan-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActivePlan(plan.id)}
                onDoubleClick={startRename}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm whitespace-nowrap transition duration-200 ease-out sm:h-8 ${
                  selected ? 'bg-accent font-semibold text-on-accent shadow-card' : 'font-medium text-ink-soft hover:text-ink'
                }`}
              >
                {plan.name}
                {chosenId === plan.id ? (
                  <>
                    <StarIcon
                      size={13}
                      weight="fill"
                      aria-hidden="true"
                      className={selected ? 'text-on-accent' : 'text-accent'}
                    />
                    <span className="sr-only">(chosen)</span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          onClick={createPlan}
          aria-label="New plan"
          title="New plan"
          icon={<PlusIcon size={18} />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          compactLabel
          aria-pressed={isChosen}
          onClick={() => toggleChosen(activeId)}
          title={isChosen ? 'Remove chosen mark' : 'Mark as the chosen plan'}
          icon={
            <StarIcon
              size={16}
              weight={isChosen ? 'fill' : 'regular'}
              className={isChosen ? 'text-accent' : undefined}
            />
          }
        >
          {isChosen ? 'Chosen' : 'Choose'}
        </Button>
        <Button
          variant="ghost"
          compactLabel
          onClick={() => duplicatePlan(activeId)}
          title="Duplicate plan"
          icon={<CopyIcon size={16} />}
        >
          Duplicate
        </Button>
        <Button
          variant="ghost"
          compactLabel
          onClick={startRename}
          title="Rename plan"
          icon={<PencilSimpleIcon size={16} />}
        >
          Rename
        </Button>
        <Button
          variant="ghost"
          compactLabel
          disabled={plans.length <= 1}
          onClick={() => {
            if (active) onDelete(active);
          }}
          title={plans.length <= 1 ? 'Create another plan before deleting this one' : 'Delete plan'}
          icon={<TrashIcon size={16} />}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
