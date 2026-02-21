import { useState } from 'react';

import { BottomSheet } from '../ui/BottomSheet';

interface NewPlanModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, year: number, semester: 'winter' | 'summer') => Promise<void> | void;
}

export function NewPlanModal({ open, onClose, onCreate }: NewPlanModalProps) {
  const [name, setName] = useState('My Plan');
  const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState<'winter' | 'summer'>('winter');

  return (
    <BottomSheet open={open} onClose={onClose} title="Create Plan">
      <div className="space-y-3">
        <label className="block text-sm">
          Name
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Year
            <input
              type="number"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </label>

          <label className="block text-sm">
            Semester
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-900"
              value={semester}
              onChange={(event) => setSemester(event.target.value as 'winter' | 'summer')}
            >
              <option value="winter">Winter</option>
              <option value="summer">Summer</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
          onClick={async () => {
            await onCreate(name, year, semester);
            onClose();
          }}
        >
          Create
        </button>
      </div>
    </BottomSheet>
  );
}
