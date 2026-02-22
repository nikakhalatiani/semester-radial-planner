import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import { useRef } from 'react';

import { useI18n } from '../../hooks/useI18n';
import type { CourseDefinition, CourseOffering, SelectedOffering, University } from '../../types';
import { LPBadge } from '../ui/LPBadge';
import { Pill, PillButton } from '../ui/Pill';
import { PflichtBar } from '../ui/PflichtBar';
import { SeminarPill } from '../ui/SeminarPill';

interface CoursePlanningCardProps {
  definition: CourseDefinition;
  offering: CourseOffering;
  selection?: SelectedOffering;
  university?: University;
  professorNames: string;
  onToggleInclude: (next: boolean) => void;
}

export function CoursePlanningCard({
  definition,
  offering,
  selection,
  university,
  professorNames,
  onToggleInclude,
}: CoursePlanningCardProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
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
  const semesterLabel = offering.semesterType === 'winter' ? 'Winter' : 'Summer';
  const semesterChip = semesterLabel.toUpperCase();
  const handleProps = selection?.isIncluded ? { ...attributes, ...listeners } : {};

  const touchStartX = useRef<number | null>(null);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm transition',
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

        if (start - end > 40 && isIncluded && !isUnavailable) {
          onToggleInclude(false);
        }
      }}
    >
      <div className="pointer-events-none absolute left-2 top-0 text-[52px] font-black leading-none" style={{ color: `${definition.color}1F` }}>
        {definition.shortCode}
      </div>

      <div className="relative z-10">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">{definition.isSeminar ? <SeminarPill /> : null}</div>
            <h4 className="text-sm font-semibold text-text-primary">{definition.name}</h4>
            <p className="text-xs text-text-secondary">{professorNames || 'TBA'}</p>
          </div>
          <div className="flex items-start gap-2">
            {isIncluded ? (
              <button
                ref={setActivatorNodeRef}
                {...handleProps}
                type="button"
                className="rounded-full border border-border bg-white p-1.5 text-text-secondary transition hover:text-text-primary active:scale-95"
                aria-label="Drag to reorder"
                onClick={(event) => event.preventDefault()}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            ) : null}
            <LPBadge credits={definition.credits} />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Pill uppercase>{semesterChip}</Pill>
          {university ? <Pill>{university.shortCode}</Pill> : null}
          <PillButton
            disabled={isUnavailable}
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={() => onToggleInclude(!isIncluded)}
            tone={isIncluded ? 'success' : 'muted'}
          >
            {isIncluded ? t('plan.included') : t('plan.excluded')}
          </PillButton>
        </div>

        {isMandatory ? <PflichtBar label={t('plan.mandatory')} /> : null}
        {isUnavailable ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-danger">{t('plan.notOffered')}</p>
        ) : null}
      </div>
    </article>
  );
}
