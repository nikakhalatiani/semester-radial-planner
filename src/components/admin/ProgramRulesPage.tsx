import { useState } from 'react';

import type { MastersProgramRule } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';

interface ProgramRulesPageProps {
  rules: MastersProgramRule[];
  canEdit: boolean;
  onSave: (rule: MastersProgramRule) => Promise<void>;
  onDelete: (ruleId: string) => Promise<void>;
}

export function ProgramRulesPage({ rules, canEdit, onSave, onDelete }: ProgramRulesPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MastersProgramRule | null>(null);
  const [jsonDraft, setJsonDraft] = useState('');

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Program Rules</h3>
        <button
          type="button"
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!canEdit}
          onClick={() => {
            const empty: MastersProgramRule = {
              id: '',
              programName: 'MSc Software Engineering',
              version: 'draft',
              totalCreditsRequired: 120,
              mandatoryCourseDefinitionIds: [],
              categoryRequirements: [],
              seminarMinCount: 1,
              praktikumMinCount: 1,
              thesisRequired: true,
              electiveCreditsMin: 70,
              isActive: false,
              notes: '',
            };
            setForm(empty);
            setJsonDraft(JSON.stringify(empty, null, 2));
            setOpen(true);
          }}
        >
          Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <button
            key={rule.id}
            type="button"
            className="w-full rounded-xl border border-border bg-white p-3 text-left dark:border-border-dark dark:bg-neutral-900"
            onClick={() => {
              setForm(rule);
              setJsonDraft(JSON.stringify(rule, null, 2));
              setOpen(true);
            }}
          >
            <p className="font-semibold">
              {rule.programName} {rule.version} {rule.isActive ? '• Active' : ''}
            </p>
            <p className="text-xs text-text-secondary dark:text-text-darkSecondary">
              Total {rule.totalCreditsRequired} LP, elective min {rule.electiveCreditsMin} LP
            </p>
          </button>
        ))}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Program Rule">
        {form ? (
          <div className="space-y-3">
            <label className="block text-sm">
              Program Name
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
                value={form.programName}
                disabled={!canEdit}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, programName: event.target.value } : prev))}
              />
            </label>
            <label className="block text-sm">
              Version
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
                value={form.version}
                disabled={!canEdit}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, version: event.target.value } : prev))}
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                disabled={!canEdit}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, isActive: event.target.checked } : prev))}
              />
              Active
            </label>

            <label className="block text-sm">
              JSON Editor
              <textarea
                className="mt-1 min-h-56 w-full rounded-xl border border-border px-3 py-2 font-mono text-xs dark:border-border-dark dark:bg-neutral-900"
                value={jsonDraft}
                disabled={!canEdit}
                onChange={(event) => setJsonDraft(event.target.value)}
              />
            </label>

            <button
              type="button"
              disabled={!canEdit}
              className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white disabled:opacity-50"
              onClick={async () => {
                const parsed = JSON.parse(jsonDraft) as MastersProgramRule;
                await onSave({ ...parsed, id: parsed.id || `rule-${Date.now()}` });
                setOpen(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              disabled={!canEdit || !form}
              className="h-11 w-full rounded-xl border border-danger text-sm font-semibold text-danger disabled:opacity-50"
              onClick={async () => {
                if (form) {
                  await onDelete(form.id);
                  setOpen(false);
                }
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </BottomSheet>
    </section>
  );
}
