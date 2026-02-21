import { useState } from 'react';

import type { CourseDefinition, CourseCategory, Professor, University } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ORDER } from '../../utils/constants';
import { BottomSheet } from '../ui/BottomSheet';
import { ColorPicker } from '../ui/ColorPicker';

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
  const buildFallback = (): CourseDefinition => ({
    id: '',
    name: '',
    shortCode: '',
    category: 'SE',
    isMandatory: false,
    isSeminar: false,
    credits: 6,
    universityId: universities[0]?.id ?? 'UNIA',
    professorIds: [],
    color: CATEGORY_COLORS.SE,
    description: '',
    isArchived: false,
    tags: [],
  });

  const [form, setForm] = useState<CourseDefinition>(initial ?? buildFallback());

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit Course' : 'Create Course'}>
      <div className="space-y-3">
        <label className="block text-sm">
          Name
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Short Code
            <input
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={form.shortCode}
              onChange={(event) => setForm((prev) => ({ ...prev, shortCode: event.target.value }))}
            />
          </label>

          <label className="block text-sm">
            Credits
            <input
              type="number"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={form.credits}
              onChange={(event) => setForm((prev) => ({ ...prev, credits: Number(event.target.value) }))}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Category
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={form.category}
              onChange={(event) => {
                const category = event.target.value as CourseCategory;
                setForm((prev) => ({ ...prev, category, color: CATEGORY_COLORS[category] }));
              }}
            >
              {CATEGORY_ORDER.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            University
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={form.universityId}
              onChange={(event) => setForm((prev) => ({ ...prev, universityId: event.target.value }))}
            >
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.shortCode}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          Professors
          <select
            multiple
            className="mt-1 min-h-24 w-full rounded-xl border border-border px-3 py-2 dark:border-border-dark dark:bg-neutral-900"
            value={form.professorIds}
            onChange={(event) => {
              const professorIds = Array.from(event.target.selectedOptions).map((option) => option.value);
              setForm((prev) => ({ ...prev, professorIds }));
            }}
          >
            {professors.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.name}
              </option>
            ))}
          </select>
        </label>

        <ColorPicker value={form.color} onChange={(color) => setForm((prev) => ({ ...prev, color }))} />

        <label className="block text-sm">
          Tags (comma separated)
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
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

        <div className="grid grid-cols-2 gap-3">
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
