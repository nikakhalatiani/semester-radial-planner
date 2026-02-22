import { useState } from 'react';

import { PLANNING_YEAR } from '../../utils/academicYears';
import { Dropdown } from '../ui/Dropdown';
import { BottomSheet } from '../ui/BottomSheet';

interface NewPlanModalProps {
  open: boolean;
  allowedYears?: number[];
  onClose: () => void;
  onCreate: (name: string, year: number, semester: 'winter' | 'summer') => Promise<void> | void;
}

export function NewPlanModal({ open, allowedYears, onClose, onCreate }: NewPlanModalProps) {
  const [name, setName] = useState('My Plan');
  const yearChoices = allowedYears && allowedYears.length > 0 ? allowedYears : [PLANNING_YEAR];
  const [year, setYear] = useState(yearChoices[0]);
  const [semester, setSemester] = useState<'winter' | 'summer'>('winter');
  const selectedYear = yearChoices.includes(year) ? year : yearChoices[0];
  const yearOptions = yearChoices.map((yearChoice) => ({ value: yearChoice, label: String(yearChoice) }));
  const semesterOptions: Array<{ value: 'winter' | 'summer'; label: string }> = [
    { value: 'winter', label: 'Winter' },
    { value: 'summer', label: 'Summer' },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title="Create Plan">
      <div className="space-y-3">
        <label className="block text-sm">
          Name
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Year
            {yearChoices.length === 1 ? (
              <input
                readOnly
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-semibold text-text-primary"
                value={yearChoices[0]}
              />
            ) : (
              <Dropdown
                className="mt-1 h-11 w-full rounded-xl border border-border px-3"
                value={year}
                options={yearOptions}
                onChange={(nextYear) => setYear(nextYear)}
              />
            )}
          </label>

          <label className="block text-sm">
            Semester
            <Dropdown
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={semester}
              options={semesterOptions}
              onChange={(nextSemester) => setSemester(nextSemester)}
            />
          </label>
        </div>

        <button
          type="button"
          className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
          onClick={async () => {
            await onCreate(name, selectedYear, semester);
            onClose();
          }}
        >
          Create
        </button>
      </div>
    </BottomSheet>
  );
}
