import clsx from 'clsx';
import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ListChecks } from 'lucide-react';

import { useI18n } from '../../hooks/useI18n';
import type { RuleEvaluationResult } from '../../types';
import { RuleRow } from './RuleRow';

interface ProgramRuleCheckerProps {
  result?: RuleEvaluationResult;
  className?: string;
  expandable?: boolean;
  defaultExpanded?: boolean;
}

export function ProgramRuleChecker({
  result,
  className,
  expandable = true,
  defaultExpanded = true,
}: ProgramRuleCheckerProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!result) {
    return null;
  }

  const progress = result.totalRequirements > 0 ? Math.round((result.metRequirements / result.totalRequirements) * 100) : 0;
  const allMet = result.metRequirements === result.totalRequirements;
  const showRows = expandable ? expanded : true;

  return (
    <div className={clsx('rounded-2xl border border-border bg-white p-3 shadow-panel', className)}>
      {expandable ? (
        <button
          type="button"
          className="flex w-full items-start justify-between gap-2 text-left"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary">
              <ListChecks size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {t('rule.requirementsCount', '{met}/{total} requirements met', {
                  met: result.metRequirements,
                  total: result.totalRequirements,
                })}
              </p>
              <p className="text-xs text-text-secondary">
                {t('rule.applicableCredits', '{credits} LP applicable', { credits: result.applicableCredits })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${allMet ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
              {allMet ? null : <AlertTriangle size={12} />}
              {progress}%
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-text-secondary">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </button>
      ) : (
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary">
              <ListChecks size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {t('rule.requirementsCount', '{met}/{total} requirements met', {
                  met: result.metRequirements,
                  total: result.totalRequirements,
                })}
              </p>
              <p className="text-xs text-text-secondary">
                {t('rule.applicableCredits', '{credits} LP applicable', { credits: result.applicableCredits })}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${allMet ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
            {allMet ? null : <AlertTriangle size={12} />}
            {progress}%
          </span>
        </div>
      )}

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all ${allMet ? 'bg-success' : 'bg-warning'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {showRows ? (
        <div className="mt-3 space-y-2">
          {result.rows.map((row) => (
            <RuleRow key={row.id} label={row.label} met={row.met} details={row.details} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
