import clsx from 'clsx';

import { useI18n } from '../../hooks/useI18n';
import type { AppMode } from '../../types';

interface HeaderProps {
  mode: AppMode;
  archivePlanOptions?: Array<{ value: string; label: string }>;
  selectedArchivePlanIds?: string[];
  onModeChange: (mode: AppMode) => void;
  onToggleArchivePlan?: (planId: string) => void;
  onManagePlans?: () => void;
  onNewPlan?: () => void;
}

export function Header({
  mode,
  archivePlanOptions = [],
  selectedArchivePlanIds = [],
  onModeChange,
  onToggleArchivePlan,
  onManagePlans,
  onNewPlan,
}: HeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-[60] border-b border-border bg-white/95 px-3 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {(['full', 'planning', 'archive'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onModeChange(item)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-xs font-semibold',
                mode === item
                  ? 'bg-neutral-900 text-white'
                  : 'bg-surface text-text-secondary',
              )}
            >
              {t(`mode.${item}`)}
            </button>
          ))}
        </div>

        {mode === 'archive' ? (
          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
            {archivePlanOptions.length > 0 ? (
              <div className="flex min-w-0 max-w-[860px] flex-wrap justify-end gap-2">
                {archivePlanOptions.map((plan) => {
                  const selected = selectedArchivePlanIds.includes(plan.value);
                  return (
                    <button
                      key={plan.value}
                      type="button"
                      className={clsx(
                        'max-w-full truncate rounded-full border px-3 py-1.5 text-xs font-semibold',
                        selected
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-border bg-surface text-text-secondary',
                      )}
                      onClick={() => onToggleArchivePlan?.(plan.value)}
                      disabled={!onToggleArchivePlan}
                      title={plan.label}
                    >
                      {plan.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
            {onManagePlans ? (
              <button
                type="button"
                className="h-10 whitespace-nowrap rounded-xl border border-border px-3 text-sm font-medium"
                onClick={onManagePlans}
              >
                {t('header.plans', 'Plans')}
              </button>
            ) : null}

            {onNewPlan ? (
              <button
                type="button"
                className="h-10 whitespace-nowrap rounded-xl border border-border px-3 text-sm font-medium"
                onClick={onNewPlan}
              >
                {t('header.newPlan', 'New Plan')}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
