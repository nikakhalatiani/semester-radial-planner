import { useState } from 'react';

import { PLANNING_YEAR } from '../../utils/academicYears';
import { Dropdown } from '../ui/Dropdown';
import { BottomSheet } from '../ui/BottomSheet';
import { useI18n } from '../../hooks/useI18n';

interface NewPlanModalProps {
  open: boolean;
  allowedYears?: number[];
  onClose: () => void;
  onCreate: (name: string, year: number, semester: 'winter' | 'summer') => Promise<void> | void;
}

export function NewPlanModal({ open, allowedYears, onClose, onCreate }: NewPlanModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState(() => t('plan.defaultName', 'My Plan'));
  const yearChoices = allowedYears && allowedYears.length > 0 ? allowedYears : [PLANNING_YEAR];
  const [year, setYear] = useState(yearChoices[0]);
  const [semester, setSemester] = useState<'winter' | 'summer'>('winter');
  const selectedYear = yearChoices.includes(year) ? year : yearChoices[0];
  const yearOptions = yearChoices.map((yearChoice) => ({ value: yearChoice, label: String(yearChoice) }));
  const semesterOptions: Array<{ value: 'winter' | 'summer'; label: string }> = [
    { value: 'winter', label: t('calendar.season.winter', 'Winter') },
    { value: 'summer', label: t('calendar.season.summer', 'Summer') },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={t('plan.createTitle', 'Create Plan')}>
      <div className="space-y-3">
        <label className="block text-sm">
          {t('common.name', 'Name')}
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            {t('common.year', 'Year')}
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
            {t('common.semester', 'Semester')}
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
          {t('common.create', 'Create')}
        </button>
      </div>
    </BottomSheet>
  );
}
