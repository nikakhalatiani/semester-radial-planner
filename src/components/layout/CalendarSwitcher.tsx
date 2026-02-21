import clsx from 'clsx';

import type { UserPlan } from '../../types';

interface CalendarSwitcherProps {
  plans: UserPlan[];
  activePlanId?: string;
  onSelect: (planId: string) => void;
}

export function CalendarSwitcher({ plans, activePlanId, onSelect }: CalendarSwitcherProps) {
  return (
    <section className="rounded-2xl bg-surface p-3 dark:bg-surface-dark">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-darkSecondary">
        Plans
      </h3>
      <div className="space-y-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.id)}
            className={clsx(
              'block w-full rounded-xl px-3 py-2 text-left text-sm',
              plan.id === activePlanId
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white text-text-secondary dark:bg-neutral-900 dark:text-text-darkSecondary',
            )}
          >
            <p className="font-semibold">{plan.name}</p>
            <p className="text-xs opacity-80">
              {plan.semesterType === 'winter' ? 'WS' : 'SS'} {plan.academicYear}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
