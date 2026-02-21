import { useState } from 'react';

import type { AdminChangelogEntry, CourseDefinition, CourseOffering, Professor } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { ChangelogView } from './ChangelogView';
import { ExamOptionsEditor } from './ExamOptionsEditor';

interface OfferingEditModalProps {
  open: boolean;
  initial?: CourseOffering;
  definitions: CourseDefinition[];
  professors: Professor[];
  changelog: AdminChangelogEntry[];
  year: number;
  semester: 'winter' | 'summer';
  onClose: () => void;
  onSave: (offering: CourseOffering) => Promise<void>;
}

export function OfferingEditModal({
  open,
  initial,
  definitions,
  professors,
  changelog,
  year,
  semester,
  onClose,
  onSave,
}: OfferingEditModalProps) {
  const buildFallback = (): CourseOffering => ({
    id: '',
    courseDefinitionId: definitions[0]?.id ?? '',
    academicYear: year,
    semesterType: semester,
    isAvailable: true,
    startDate: `${year}-${semester === 'winter' ? '10' : '04'}-01`,
    endDate: `${semester === 'winter' ? year + 1 : year}-${semester === 'winter' ? '01' : '07'}-15`,
    examOptions: [
      {
        id: '',
        type: 'written',
        date: `${semester === 'winter' ? year + 1 : year}-${semester === 'winter' ? '02' : '08'}-20`,
        isDefault: true,
      },
    ],
    notes: '',
    professorIds: [],
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: 'admin',
  });

  const [form, setForm] = useState<CourseOffering>(initial ?? buildFallback());

  const localChangelog = changelog.filter((log) => log.entityType === 'courseOfferings' && log.entityId === form.id);

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit Offering' : 'Create Offering'}>
      <div className="space-y-3">
        <label className="block text-sm">
          Course
          <select
            className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
            value={form.courseDefinitionId}
            onChange={(event) => setForm((prev) => ({ ...prev, courseDefinitionId: event.target.value }))}
          >
            {definitions.map((definition) => (
              <option key={definition.id} value={definition.id}>
                {definition.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) => setForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
            />
            Available
          </label>

          <label className="block text-sm">
            Midterm
            <input
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={form.midtermDate?.slice(0, 10) ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, midtermDate: event.target.value || undefined }))}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Start Date
            <input
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={form.startDate.slice(0, 10)}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </label>
          <label className="block text-sm">
            End Date
            <input
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={form.endDate.slice(0, 10)}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </label>
        </div>

        <label className="block text-sm">
          Professor override
          <select
            multiple
            className="mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2 dark:border-border-dark dark:bg-neutral-900"
            value={form.professorIds ?? []}
            onChange={(event) => {
              const ids = Array.from(event.target.selectedOptions).map((option) => option.value);
              setForm((prev) => ({ ...prev, professorIds: ids }));
            }}
          >
            {professors.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.name}
              </option>
            ))}
          </select>
        </label>

        <ExamOptionsEditor options={form.examOptions} onChange={(examOptions) => setForm((prev) => ({ ...prev, examOptions }))} />

        <label className="block text-sm">
          Notes
          <textarea
            className="mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2 dark:border-border-dark dark:bg-neutral-900"
            value={form.notes ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </label>

        <ChangelogView logs={localChangelog} />

        <button
          type="button"
          className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
          onClick={async () => {
            const generatedOfferingId = form.id || `offering-${Date.now()}`;
            await onSave({
              ...form,
              id: generatedOfferingId,
              examOptions: form.examOptions.map((option) => ({
                ...option,
                id: option.id || `${generatedOfferingId}-exam-${Math.random().toString(36).slice(2, 8)}`,
              })),
              lastUpdatedAt: new Date().toISOString(),
            });
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </BottomSheet>
  );
}
