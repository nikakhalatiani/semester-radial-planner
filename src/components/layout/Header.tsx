import clsx from 'clsx';
import { useState } from 'react';

import { useI18n } from '../../hooks/useI18n';
import type { AppMode, SemesterType } from '../../types';
import { getAllowedSemestersForYear } from '../../utils/academicYears';
import { Dropdown } from '../ui/Dropdown';

interface HeaderProps {
  mode: AppMode;
  archiveYear: number;
  archiveSemester: SemesterType;
  archiveYears: number[];
  planOptions?: Array<{ value: string; label: string }>;
  activePlanId?: string;
  onModeChange: (mode: AppMode) => void;
  onArchiveChange: (year: number, semester: SemesterType) => void;
  onPlanChange?: (planId: string) => void;
  onNewPlan?: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportPlan: () => void;
  onExportFullDb?: () => void;
}

export function Header({
  mode,
  archiveYear,
  archiveSemester,
  archiveYears,
  planOptions = [],
  activePlanId,
  onModeChange,
  onArchiveChange,
  onPlanChange,
  onNewPlan,
  onExportSvg,
  onExportPng,
  onExportPlan,
  onExportFullDb,
}: HeaderProps) {
  const { t } = useI18n();
  const [exportOpen, setExportOpen] = useState(false);

  const yearChoices = archiveYears.length > 0 ? archiveYears : [archiveYear];
  const yearOptions = yearChoices.map((year) => ({ value: year, label: String(year) }));
  const allowedSemesters = getAllowedSemestersForYear(archiveYear);
  const selectedPlanId = activePlanId ?? planOptions[0]?.value;
  const semesterOptions: Array<{ value: SemesterType; label: string }> = allowedSemesters.map((semester) => ({
    value: semester,
    label: semester === 'winter' ? 'WS' : 'SS',
  }));

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 px-3 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden items-center gap-2 lg:flex">
          {(['full', 'planning', 'archive'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onModeChange(item)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-xs font-semibold',
                mode === item
                  ? 'bg-neutral-900 text-white'
                  : 'bg-surface text-text-secondary',
              )}
            >
              {t(`mode.${item}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {mode !== 'archive' && planOptions.length > 0 && selectedPlanId && onPlanChange ? (
            <Dropdown
              className="h-10 min-w-[170px] max-w-[220px] rounded-xl border border-border bg-white px-2 text-sm"
              value={selectedPlanId}
              options={planOptions}
              onChange={onPlanChange}
            />
          ) : null}

          {mode !== 'archive' && onNewPlan ? (
            <button
              type="button"
              className="h-10 rounded-xl border border-border px-3 text-sm font-medium"
              onClick={onNewPlan}
            >
              New Plan
            </button>
          ) : null}

          {mode === 'archive' ? (
            <>
              <Dropdown
                className="h-10 rounded-xl border border-border bg-white px-2 text-sm"
                value={archiveYear}
                options={yearOptions}
                onChange={(nextYear) => onArchiveChange(nextYear, archiveSemester)}
              />
              <Dropdown
                className="h-10 rounded-xl border border-border bg-white px-2 text-sm"
                value={archiveSemester}
                options={semesterOptions}
                onChange={(nextSemester) => onArchiveChange(archiveYear, nextSemester)}
              />
            </>
          ) : null}

          <div className="relative">
            <button
              type="button"
              className="h-10 rounded-xl border border-border px-3 text-sm"
              onClick={() => setExportOpen((prev) => !prev)}
            >
              Export
            </button>
            {exportOpen ? (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-white p-1 shadow-panel">
                <button className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-surface" onClick={onExportSvg} type="button">
                  SVG
                </button>
                <button className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-surface" onClick={onExportPng} type="button">
                  PNG
                </button>
                <button className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-surface" onClick={onExportPlan} type="button">
                  JSON Plan
                </button>
                {onExportFullDb ? (
                  <button
                    className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-surface"
                    onClick={onExportFullDb}
                    type="button"
                  >
                    JSON Full DB
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
