import clsx from 'clsx';
import type {
  CourseDefinition,
  CourseOffering,
  CourseCategory,
  SelectedOffering,
  University,
} from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { CategoryFilterChips } from './CategoryFilterChips';
import { CoursePlanningCard } from './CoursePlanningCard';

export interface PlanningRow {
  definition: CourseDefinition;
  offering: CourseOffering;
  programSemester?: number;
  selection?: SelectedOffering;
  university?: University;
  professorNames: string;
}

export interface RuleScopePlanOption {
  id: string;
  label: string;
}

interface PlanningPanelProps {
  rows: PlanningRow[];
  searchQuery: string;
  activeCategories: CourseCategory[];
  onSearch: (query: string) => void;
  onToggleCategory: (category: CourseCategory) => void;
  onToggleInclude: (offeringId: string, next: boolean) => void;
  className?: string;
  cardsClassName?: string;
}

export function PlanningPanel({
  rows,
  searchQuery,
  activeCategories,
  onSearch,
  onToggleCategory,
  onToggleInclude,
  className,
  cardsClassName,
}: PlanningPanelProps) {
  const { t } = useI18n();
  return (
    <section className={clsx('rounded-3xl bg-surface p-3', className)}>
      <header className="mb-3 space-y-3">
        <CategoryFilterChips active={activeCategories} onToggle={onToggleCategory} />
        <input
          className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
          placeholder={t('plan.search', 'Search courses')}
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
        />
        <p className="text-xs text-text-secondary">
          {t('plan.lineOrderHint', 'Course line order follows the sequence in which courses are included.')}
        </p>
      </header>

      <div
        className={clsx(
          cardsClassName
            ? 'space-y-3 overflow-y-auto pb-2'
            : 'max-h-[62vh] space-y-3 overflow-y-auto pb-6',
          cardsClassName,
        )}
      >
        {rows.map((row) => (
          <CoursePlanningCard
            key={row.offering.id}
            definition={row.definition}
            offering={row.offering}
            programSemester={row.programSemester}
            selection={row.selection}
            university={row.university}
            professorNames={row.professorNames}
            onToggleInclude={(next) => onToggleInclude(row.offering.id, next)}
          />
        ))}
      </div>
    </section>
  );
}
