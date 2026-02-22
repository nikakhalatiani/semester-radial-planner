import { CATEGORY_LABELS, UNCATEGORIZED_LABEL } from '../../utils/constants';
import type { CourseCategory } from '../../types';

interface CategoryBadgeProps {
  category?: CourseCategory;
  color: string;
}

export function CategoryBadge({ category, color }: CategoryBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {category ? CATEGORY_LABELS[category] : UNCATEGORIZED_LABEL}
    </span>
  );
}
