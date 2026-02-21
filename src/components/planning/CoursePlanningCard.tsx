import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { useRef } from 'react';

import type { CourseDefinition, CourseOffering, SelectedOffering, University } from '../../types';
import { LPBadge } from '../ui/LPBadge';
import { PflichtBar } from '../ui/PflichtBar';
import { SeminarPill } from '../ui/SeminarPill';
import { UniversityTag } from '../ui/UniversityTag';
import { ExamTypePill } from './ExamTypePill';

interface CoursePlanningCardProps {
  definition: CourseDefinition;
  offering: CourseOffering;
  selection?: SelectedOffering;
  university?: University;
  professorNames: string;
  onToggleInclude: (next: boolean) => void;
  onSelectExam: (examOptionId: string) => void;
}

export function CoursePlanningCard({
  definition,
  offering,
  selection,
  university,
  professorNames,
  onToggleInclude,
  onSelectExam,
}: CoursePlanningCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: offering.id,
    disabled: !selection?.isIncluded,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isIncluded = selection?.isIncluded ?? false;
  const isMandatory = definition.isMandatory;
  const isUnavailable = !offering.isAvailable;

  const touchStartX = useRef<number | null>(null);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm transition dark:border-border-dark dark:bg-neutral-900',
        isDragging ? 'z-20 shadow-panel' : undefined,
        isUnavailable ? 'opacity-40' : undefined,
      )}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        if (start == null || end == null) {
          return;
        }

        if (start - end > 40 && isIncluded && !isMandatory && !isUnavailable) {
          onToggleInclude(false);
        }
      }}
    >
      <div className="pointer-events-none absolute left-2 top-0 text-[52px] font-black leading-none" style={{ color: `${definition.color}1F` }}>
        {definition.shortCode}
      </div>
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: definition.color }} />

      <div className="relative z-10 ml-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            {definition.isSeminar ? <SeminarPill /> : null}
            <h4 className="text-sm font-semibold text-text-primary dark:text-text-darkPrimary">{definition.name}</h4>
            <p className="text-xs text-text-secondary dark:text-text-darkSecondary">{professorNames || 'TBA'}</p>
          </div>
          <LPBadge credits={definition.credits} />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {university ? <UniversityTag code={university.shortCode} label={university.name} /> : null}
          <button
            type="button"
            disabled={isMandatory || isUnavailable}
            onClick={() => onToggleInclude(!isIncluded)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-semibold',
              isIncluded ? 'bg-success text-white' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100',
              isMandatory || isUnavailable ? 'cursor-not-allowed opacity-70' : undefined,
            )}
          >
            {isIncluded ? 'Included' : 'Excluded'}
          </button>
          {selection?.isIncluded ? (
            <button
              type="button"
              className="rounded border border-border px-2 py-1 text-xs dark:border-border-dark"
              {...attributes}
              {...listeners}
            >
              Drag
            </button>
          ) : null}
        </div>

        <ExamTypePill
          options={offering.examOptions}
          selectedId={selection?.selectedExamOptionId ?? offering.examOptions[0]?.id ?? ''}
          onSelect={onSelectExam}
          disabled={isUnavailable}
        />

        {isMandatory ? <PflichtBar /> : null}
        {isUnavailable ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-danger">Not offered this year</p>
        ) : null}
      </div>
    </article>
  );
}
