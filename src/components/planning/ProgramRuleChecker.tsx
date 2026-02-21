import { useState } from 'react';

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

  return (
    <div className="sticky bottom-2 z-10 mt-4 rounded-2xl bg-checker p-3 shadow-panel">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-white"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span>
          {result.metRequirements}/{result.totalRequirements} requirements met ~~ {result.applicableCredits} LP applicable
        </span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

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
