import clsx from 'clsx';
import { AlertTriangle, ChevronUp, ListChecks } from 'lucide-react';

import { useI18n } from '../../hooks/useI18n';
import type { RuleEvaluationResult } from '../../types';
import type { RuleScopePlanOption } from './PlanningPanel';
import { ProgramRuleChecker } from './ProgramRuleChecker';

interface PlanningRulesPanelProps {
  ruleResult?: RuleEvaluationResult;
  ruleScopePlanOptions?: RuleScopePlanOption[];
  selectedRuleScopePlanIds?: string[];
  onToggleRuleScopePlan?: (planId: string) => void;
  showScope?: boolean;
  className?: string;
  checkerExpandable?: boolean;
}

interface RuleScopeSelectorProps {
  ruleScopePlanOptions?: RuleScopePlanOption[];
  selectedRuleScopePlanIds?: string[];
  onToggleRuleScopePlan?: (planId: string) => void;
  className?: string;
}

interface RulesCollapsedPreviewProps extends RuleScopeSelectorProps {
  ruleResult?: RuleEvaluationResult;
  showScope?: boolean;
  onExpand?: () => void;
}

function RuleScopeSelector({
  ruleScopePlanOptions = [],
  selectedRuleScopePlanIds = [],
  onToggleRuleScopePlan,
  className,
}: RuleScopeSelectorProps) {
  const { t } = useI18n();

  if (ruleScopePlanOptions.length === 0) {
    return null;
  }

  return (
    <div className={clsx('space-y-2 rounded-2xl border border-border bg-white p-3', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {t('plan.ruleScope', 'Rule Scope (Semester Plans)')}
      </p>
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
              onClick={() => onToggleRuleScopePlan?.(plan.id)}
              disabled={!onToggleRuleScopePlan}
            >
              {plan.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RulesProgressSummary({
  ruleResult,
  onExpand,
}: {
  ruleResult?: RuleEvaluationResult;
  onExpand?: () => void;
}) {
  const { t } = useI18n();

  if (!ruleResult) {
    return (
      <div className="rounded-2xl border border-border bg-white p-3 text-sm text-text-secondary">
        <div className="flex items-center justify-between gap-2">
          <span>{t('rule.overlay.noRule', 'No active rule set')}</span>
          {onExpand ? (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-secondary transition hover:bg-surface"
              onClick={onExpand}
              aria-label={t('rule.overlay.show', 'Expand')}
            >
              <ChevronUp size={14} />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const progress =
    ruleResult.totalRequirements > 0
      ? Math.round((ruleResult.metRequirements / ruleResult.totalRequirements) * 100)
      : 0;
  const allMet = ruleResult.metRequirements === ruleResult.totalRequirements;

  return (
    <div className="rounded-2xl border border-border bg-white p-3 shadow-panel">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary">
            <ListChecks size={15} />
          </span>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {t('rule.requirementsCount', '{met}/{total} requirements met', {
                met: ruleResult.metRequirements,
                total: ruleResult.totalRequirements,
              })}
            </p>
            <p className="text-xs text-text-secondary">
              {t('rule.applicableCredits', '{credits} LP applicable', {
                credits: ruleResult.applicableCredits,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${allMet ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}
          >
            {allMet ? null : <AlertTriangle size={12} />}
            {progress}%
          </span>
          {onExpand ? (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-secondary transition hover:bg-surface"
              onClick={onExpand}
              aria-label={t('rule.overlay.show', 'Expand')}
            >
              <ChevronUp size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all ${allMet ? 'bg-success' : 'bg-warning'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function PlanningRulesCollapsedPreview({
  ruleResult,
  ruleScopePlanOptions = [],
  selectedRuleScopePlanIds = [],
  onToggleRuleScopePlan,
  showScope = true,
  onExpand,
}: RulesCollapsedPreviewProps) {
  return (
    <div className="space-y-2">
      {showScope ? (
        <RuleScopeSelector
          ruleScopePlanOptions={ruleScopePlanOptions}
          selectedRuleScopePlanIds={selectedRuleScopePlanIds}
          onToggleRuleScopePlan={onToggleRuleScopePlan}
        />
      ) : null}
      <RulesProgressSummary ruleResult={ruleResult} onExpand={onExpand} />
    </div>
  );
}

export function PlanningRulesPanel({
  ruleResult,
  ruleScopePlanOptions = [],
  selectedRuleScopePlanIds = [],
  onToggleRuleScopePlan,
  showScope = true,
  className,
  checkerExpandable = true,
}: PlanningRulesPanelProps) {
  return (
    <section className={clsx('rounded-3xl border border-border bg-surface p-3', className)}>
      {showScope ? (
        <RuleScopeSelector
          ruleScopePlanOptions={ruleScopePlanOptions}
          selectedRuleScopePlanIds={selectedRuleScopePlanIds}
          onToggleRuleScopePlan={onToggleRuleScopePlan}
        />
      ) : null}

      <ProgramRuleChecker
        result={ruleResult}
        expandable={checkerExpandable}
        className={showScope ? 'mt-3' : undefined}
      />
    </section>
  );
}
