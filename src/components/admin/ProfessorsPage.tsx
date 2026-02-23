import { useState } from 'react';

import type { Professor, University } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';
import { Dropdown } from '../ui/Dropdown';

interface ProfessorsPageProps {
  professors: Professor[];
  universities: University[];
  canEdit: boolean;
  onSave: (professor: Professor) => Promise<void>;
  onDelete: (professorId: string) => Promise<void>;
}

export function ProfessorsPage({ professors, universities, canEdit, onSave, onDelete }: ProfessorsPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Professor | null>(null);
  const universityOptions = universities.map((university) => ({
    value: university.id,
    label: university.shortCode,
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Professors/Lecturers</h3>
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => {
            setForm({
              id: '',
              name: '',
              universityId: universities[0]?.id ?? 'UNIA',
              isActive: true,
            });
            setOpen(true);
          }}
        >
          Add Professor/Lecturer
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {professors.map((professor) => (
          <button
            key={professor.id}
            type="button"
            disabled={!canEdit}
            className="rounded-xl border border-border bg-white p-3 text-left disabled:opacity-70"
            onClick={() => {
              setForm(professor);
              setOpen(true);
            }}
          >
            <p className="font-semibold">{professor.name}</p>
            <p className="text-xs text-text-secondary">{professor.isActive ? 'Active' : 'Inactive'}</p>
          </button>
        ))}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Professor/Lecturer">
        {form ? (
          <div className="space-y-3">
            <label className="block text-sm">
              Name
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border px-3"
                value={form.name}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
              />
            </label>
            <label className="block text-sm">
              University
              <Dropdown
                className="mt-1 h-11 w-full rounded-xl border border-border px-3"
                value={form.universityId}
                options={universityOptions}
                onChange={(universityId) =>
                  setForm((prev) => (prev ? { ...prev, universityId } : prev))
                }
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => (prev ? { ...prev, isActive: event.target.checked } : prev))
                }
              />
              Active
            </label>
            <button
              type="button"
              disabled={!canEdit}
              className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
              onClick={async () => {
                if (form) {
                  await onSave({ ...form, id: form.id || `prof-${Date.now()}` });
                }
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
