import type {
  CourseDefinition,
  CourseOffering,
  CourseCategory,
  RuleEvaluationResult,
  SelectedOffering,
  University,
} from '../../types';
import { CategoryFilterChips } from './CategoryFilterChips';
import { CoursePlanningCard } from './CoursePlanningCard';
import { ProgramRuleChecker } from './ProgramRuleChecker';

export interface PlanningRow {
  definition: CourseDefinition;
  offering: CourseOffering;
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
  ruleResult?: RuleEvaluationResult;
  onSearch: (query: string) => void;
  onToggleCategory: (category: CourseCategory) => void;
  onToggleInclude: (offeringId: string, next: boolean) => void;
  ruleScopePlanOptions: RuleScopePlanOption[];
  selectedRuleScopePlanIds: string[];
  onToggleRuleScopePlan: (planId: string) => void;
}

export function PlanningPanel({
  rows,
  searchQuery,
  activeCategories,
  ruleResult,
  onSearch,
  onToggleCategory,
  onToggleInclude,
  ruleScopePlanOptions,
  selectedRuleScopePlanIds,
  onToggleRuleScopePlan,
}: PlanningPanelProps) {
  return (
    <section className="rounded-3xl bg-surface p-3">
      <header className="mb-3 space-y-3">
        <CategoryFilterChips active={activeCategories} onToggle={onToggleCategory} />
        <input
          className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
          placeholder="Search courses"
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
        />
        <p className="text-xs text-text-secondary">
          Course line order follows the sequence in which courses are included.
        </p>
      </header>

      <div className="max-h-[62vh] space-y-3 overflow-y-auto pb-6">
        {rows.map((row) => (
          <CoursePlanningCard
            key={row.offering.id}
            definition={row.definition}
            offering={row.offering}
            selection={row.selection}
            university={row.university}
            professorNames={row.professorNames}
            onToggleInclude={(next) => onToggleInclude(row.offering.id, next)}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-border bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Rule Scope (Semester Plans)</p>
        <div className="flex flex-wrap gap-2">
          {ruleScopePlanOptions.map((plan) => {
            const selected = selectedRuleScopePlanIds.includes(plan.id);
            return (
              <button
                key={plan.id}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  selected
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-border bg-surface text-text-secondary'
                }`}
                onClick={() => onToggleRuleScopePlan(plan.id)}
              >
                {plan.label}
              </button>
            );
          })}
        </div>
      </div>

      <ProgramRuleChecker result={ruleResult} />
    </section>
  );
}
