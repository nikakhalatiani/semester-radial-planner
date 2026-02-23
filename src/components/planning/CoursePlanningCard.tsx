import clsx from 'clsx';
import { useRef } from 'react';
import { Check, Plus } from 'lucide-react';

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

  const isIncluded = selection?.isIncluded ?? false;
  const isMandatory = definition.isMandatory;
  const isUnavailable = !offering.isAvailable;
  const semesterLabel = offering.semesterType === 'winter' ? 'Winter' : 'Summer';
  const semesterChip = semesterLabel.toUpperCase();

  const touchStartX = useRef<number | null>(null);

  return (
    <article
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm transition',
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
            tone={isIncluded ? 'success' : 'neutral'}
            className="gap-1.5"
            title={isIncluded ? 'Click to exclude this course' : 'Click to include this course'}
            aria-pressed={isIncluded}
          >
            {isIncluded ? <Check size={14} strokeWidth={2.6} /> : <Plus size={14} strokeWidth={2.6} />}
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
