import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ListChecks } from 'lucide-react';

import type { RuleEvaluationResult } from '../../types';
import { RuleRow } from './RuleRow';

interface ProgramRuleCheckerProps {
  result?: RuleEvaluationResult;
}

export function ProgramRuleChecker({ result }: ProgramRuleCheckerProps) {
  const [expanded, setExpanded] = useState(true);

  if (!result) {
    return null;
  }

  const progress = result.totalRequirements > 0 ? Math.round((result.metRequirements / result.totalRequirements) * 100) : 0;
  const allMet = result.metRequirements === result.totalRequirements;

  return (
    <div className="sticky bottom-2 z-10 mt-4 rounded-2xl border border-border bg-white p-3 shadow-panel">
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
              {result.metRequirements}/{result.totalRequirements} requirements met
            </p>
            <p className="text-xs text-text-secondary">{result.applicableCredits} LP applicable</p>
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

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all ${allMet ? 'bg-success' : 'bg-warning'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {expanded ? (
        <div className="mt-3 space-y-2">
          {result.rows.map((row) => (
            <RuleRow key={row.id} label={row.label} met={row.met} details={row.details} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
