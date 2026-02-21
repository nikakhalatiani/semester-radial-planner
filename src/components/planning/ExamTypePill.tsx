import clsx from 'clsx';

import type { ExamOption } from '../../types';

interface ExamTypePillProps {
  options: ExamOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

function labelForType(type: ExamOption['type']) {
  if (type === 'oral') {
    return 'Oral';
  }
  if (type === 'project') {
    return 'Project';
  }
  if (type === 'none') {
    return 'None';
  }
  return 'Written';
}

export function ExamTypePill({ options, selectedId, onSelect, disabled = false }: ExamTypePillProps) {
  if (options.length <= 1) {
    return (
      <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary dark:bg-surface-dark dark:text-text-darkSecondary">
        {options[0] ? labelForType(options[0].type) : 'No exam'}
      </span>
    );
  }

  return (
    <div className="inline-flex min-h-11 rounded-full border border-border bg-surface p-1 dark:border-border-dark dark:bg-surface-dark">
      {options.map((option) => {
        const isActive = option.id === selectedId;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            className={clsx(
              'min-h-9 min-w-[84px] rounded-full px-3 text-xs font-semibold transition',
              isActive
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-text-secondary dark:text-text-darkSecondary',
              disabled ? 'cursor-not-allowed opacity-60' : undefined,
            )}
          >
            {labelForType(option.type)}
          </button>
        );
      })}
    </div>
  );
}
