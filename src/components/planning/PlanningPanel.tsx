import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

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

interface PlanningPanelProps {
  rows: PlanningRow[];
  searchQuery: string;
  activeCategories: CourseCategory[];
  ruleResult?: RuleEvaluationResult;
  onSearch: (query: string) => void;
  onToggleCategory: (category: CourseCategory) => void;
  onToggleInclude: (offeringId: string, next: boolean) => void;
  onSelectExam: (offeringId: string, examOptionId: string) => void;
  onDragReorder: (activeId: string, overId: string) => void;
}

export function PlanningPanel({
  rows,
  searchQuery,
  activeCategories,
  ruleResult,
  onSearch,
  onToggleCategory,
  onToggleInclude,
  onSelectExam,
  onDragReorder,
}: PlanningPanelProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }
    onDragReorder(String(event.active.id), String(event.over.id));
  };

  const includedIds = rows.filter((row) => row.selection?.isIncluded).map((row) => row.offering.id);

  return (
    <section className="rounded-3xl bg-surface p-3 dark:bg-surface-dark">
      <header className="mb-3 space-y-3">
        <CategoryFilterChips active={activeCategories} onToggle={onToggleCategory} />
        <input
          className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm dark:border-border-dark dark:bg-neutral-900"
          placeholder="Search courses"
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
        />
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={includedIds} strategy={verticalListSortingStrategy}>
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
                onSelectExam={(examOptionId) => onSelectExam(row.offering.id, examOptionId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ProgramRuleChecker result={ruleResult} />
    </section>
  );
}
