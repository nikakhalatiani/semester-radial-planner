import { useState } from 'react';

import type { University } from '../../types';
import { BottomSheet } from '../ui/BottomSheet';

interface UniversitiesPageProps {
  universities: University[];
  canEdit: boolean;
  onSave: (university: University) => Promise<void>;
  onDelete: (universityId: string) => Promise<void>;
}

export function UniversitiesPage({ universities, canEdit, onSave, onDelete }: UniversitiesPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<University | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Universities</h3>
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => {
            setForm({
              id: '',
              name: '',
              shortCode: '',
              city: '',
              color: '#000000',
            });
            setOpen(true);
          }}
        >
          Add University
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {universities.map((university) => (
          <button
            key={university.id}
            type="button"
            disabled={!canEdit}
            className="rounded-xl border border-border bg-white p-3 text-left disabled:opacity-70 dark:border-border-dark dark:bg-neutral-900"
            onClick={() => {
              setForm(university);
              setOpen(true);
            }}
          >
            <p className="font-semibold">{university.name}</p>
            <p className="text-xs text-text-secondary dark:text-text-darkSecondary">
              {university.shortCode} • {university.city}
            </p>
          </button>
        ))}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="University">
        {form ? (
          <div className="space-y-3">
            <label className="block text-sm">
              Name
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
                value={form.name}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
              />
            </label>
            <label className="block text-sm">
              Code
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
                value={form.shortCode}
                onChange={(event) =>
                  setForm((prev) => (prev ? { ...prev, shortCode: event.target.value.toUpperCase() } : prev))
                }
              />
            </label>
            <label className="block text-sm">
              City
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
                value={form.city}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, city: event.target.value } : prev))}
              />
            </label>
            <button
              type="button"
              disabled={!canEdit}
              className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
              onClick={async () => {
                if (form) {
                  await onSave({ ...form, id: form.id || `uni-${Date.now()}` });
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
