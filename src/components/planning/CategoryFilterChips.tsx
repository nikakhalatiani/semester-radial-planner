import clsx from 'clsx';

import type { CourseCategory } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ORDER } from '../../utils/constants';

interface CategoryFilterChipsProps {
  active: CourseCategory[];
  onToggle: (category: CourseCategory) => void;
}

export function CategoryFilterChips({ active, onToggle }: CategoryFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((category) => {
        const enabled = active.includes(category);
        return (
          <button
            key={category}
            type="button"
            onClick={() => onToggle(category)}
            className={clsx(
              'rounded-full border px-3 py-1 text-xs font-semibold',
              enabled
                ? 'border-transparent text-white'
                : 'border-border bg-white text-text-secondary dark:border-border-dark dark:bg-neutral-900 dark:text-text-darkSecondary',
            )}
            style={enabled ? { backgroundColor: CATEGORY_COLORS[category] } : undefined}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
