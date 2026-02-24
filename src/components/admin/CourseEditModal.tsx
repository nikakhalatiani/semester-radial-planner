import { useState } from 'react';

import type { CourseDefinition, Professor, University } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ORDER, UNCATEGORIZED_COLOR } from '../../utils/constants';
import { BottomSheet } from '../ui/BottomSheet';
import { ColorPicker } from '../ui/ColorPicker';
import { Dropdown, MultiDropdown } from '../ui/Dropdown';

const UNASSIGNED_PROFESSOR_VALUE = '__unassigned_professor__';

interface CourseEditModalProps {
  open: boolean;
  initial?: CourseDefinition;
  universities: University[];
  professors: Professor[];
  onClose: () => void;
  onSave: (definition: CourseDefinition) => Promise<void>;
}

export function CourseEditModal({
  open,
  initial,
  universities,
  professors,
  onClose,
  onSave,
}: CourseEditModalProps) {
  const isCourseCategory = (value: string): value is (typeof CATEGORY_ORDER)[number] =>
    CATEGORY_ORDER.includes(value as (typeof CATEGORY_ORDER)[number]);

  const buildFallback = (): CourseDefinition => ({
    id: '',
    name: '',
    shortCode: '',
    category: undefined,
    recommendedSemester: undefined,
    isMandatory: false,
    isSeminar: false,
    credits: 6,
    universityId: undefined,
    professorIds: [],
    color: UNCATEGORIZED_COLOR,
    description: '',
    isArchived: false,
    tags: [],
  });

  const [form, setForm] = useState<CourseDefinition>(initial ?? buildFallback());
  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...CATEGORY_ORDER.map((category) => ({ value: category, label: category })),
  ];
  const universityOptions = [
    { value: '', label: 'Unassigned' },
    ...universities.map((university) => ({
      value: university.id,
      label: university.shortCode,
    })),
  ];
  const professorOptions = professors
    .filter((professor) => professor.isActive || form.professorIds.includes(professor.id))
    .map((professor) => ({
      value: professor.id,
      label: professor.isActive ? professor.name : `${professor.name} (inactive)`,
    }));
  const professorOptionsWithUnassigned = [
    { value: UNASSIGNED_PROFESSOR_VALUE, label: 'Unassigned (clear selection)' },
    ...professorOptions,
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit Course' : 'Create Course'}>
      <div className="space-y-3">
        <label className="block text-sm">
          Name
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            Short Code
            <input
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={form.shortCode}
              onChange={(event) => setForm((prev) => ({ ...prev, shortCode: event.target.value }))}
            />
          </label>

          <label className="block text-sm">
            Credits
            <input
              type="number"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={form.credits}
              onChange={(event) => setForm((prev) => ({ ...prev, credits: Number(event.target.value) }))}
            />
          </label>

          <label className="block text-sm">
            Program Semester
            <input
              type="number"
              min={1}
              max={12}
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={form.recommendedSemester ?? ''}
              placeholder="e.g. 1"
              onChange={(event) => {
                const value = event.target.value.trim();
                const parsed = Number(value);
                setForm((prev) => ({
                  ...prev,
                  recommendedSemester:
                    !value || Number.isNaN(parsed) ? undefined : Math.max(1, Math.min(12, Math.floor(parsed))),
                }));
              }}
            />
            <p className="mt-1 text-xs text-text-secondary">Odd semesters are winter, even semesters are summer.</p>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Category
            <Dropdown
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={form.category ?? ''}
              options={categoryOptions}
              onChange={(categoryValue) => {
                const category = categoryValue && isCourseCategory(categoryValue) ? categoryValue : undefined;
                setForm((prev) => ({
                  ...prev,
                  category,
                  color: category ? CATEGORY_COLORS[category] : UNCATEGORIZED_COLOR,
                }));
              }}
            />
          </label>

          <label className="block text-sm">
            University
            <Dropdown
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={form.universityId ?? ''}
              options={universityOptions}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, universityId: event || undefined }))
              }
            />
          </label>
        </div>

        <label className="block text-sm">
          Professors/Lecturers
          <MultiDropdown
            className="mt-1 min-h-24 w-full rounded-xl border border-border px-3 py-2"
            values={form.professorIds}
            options={professorOptionsWithUnassigned}
            onChange={(professorIds) =>
              setForm((prev) => ({
                ...prev,
                professorIds: professorIds.includes(UNASSIGNED_PROFESSOR_VALUE)
                  ? []
                  : professorIds.filter((id) => id !== UNASSIGNED_PROFESSOR_VALUE),
              }))
            }
          />
        </label>

        <ColorPicker value={form.color} onChange={(color) => setForm((prev) => ({ ...prev, color }))} />

        <label className="block text-sm">
          Tags (comma separated)
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={form.tags?.join(',') ?? ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                tags: event.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }))
            }
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isMandatory}
              onChange={(event) => setForm((prev) => ({ ...prev, isMandatory: event.target.checked }))}
            />
            Mandatory
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isSeminar}
              onChange={(event) => setForm((prev) => ({ ...prev, isSeminar: event.target.checked }))}
            />
            Seminar
          </label>
        </div>

        <button
          type="button"
          className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
          onClick={async () => {
            const payload = form.id ? form : { ...form, id: `course-${Date.now()}` };
            await onSave(payload);
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </BottomSheet>
  );
}
