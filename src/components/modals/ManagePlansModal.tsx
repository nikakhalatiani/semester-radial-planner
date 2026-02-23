import clsx from 'clsx';

import type { UserPlan } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';

interface ManagePlansModalProps {
  open: boolean;
  plans: UserPlan[];
  activePlanId?: string;
  onClose: () => void;
  onSelect: (planId: string) => void;
  onDelete: (planId: string) => Promise<void>;
}

export function ManagePlansModal({
  open,
  plans,
  activePlanId,
  onClose,
  onSelect,
  onDelete,
}: ManagePlansModalProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Manage Plans">
      <div className="space-y-2">
        {plans.length === 0 ? (
          <p className="text-sm text-text-secondary">No plans available.</p>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className={clsx(
                'rounded-xl border p-3',
                plan.id === activePlanId ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-border bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    onSelect(plan.id);
                    onClose();
                  }}
                >
                  <p className="truncate text-sm font-semibold">{plan.name}</p>
                  <p className={clsx('text-xs', plan.id === activePlanId ? 'text-white/80' : 'text-text-secondary')}>
                    {plan.semesterType === 'winter' ? 'WS' : 'SS'} {plan.academicYear}
                  </p>
                </button>

                <button
                  type="button"
                  className={clsx(
                    'h-8 rounded-lg border px-2 text-xs font-medium',
                    plans.length <= 1
                      ? 'border-border text-text-secondary opacity-50'
                      : 'border-danger text-danger',
                  )}
                  disabled={plans.length <= 1}
                  onClick={async () => {
                    await onDelete(plan.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
}
