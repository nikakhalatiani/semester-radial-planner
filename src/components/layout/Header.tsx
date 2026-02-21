import clsx from 'clsx';
import { useState } from 'react';

import { useI18n } from '../../hooks/useI18n';
import type { AppMode, SemesterType } from '../../types';

interface HeaderProps {
  mode: AppMode;
  archiveYear: number;
  archiveSemester: SemesterType;
  onModeChange: (mode: AppMode) => void;
  onArchiveChange: (year: number, semester: SemesterType) => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportPlan: () => void;
  onExportFullDb?: () => void;
}

export function Header({
  mode,
  archiveYear,
  archiveSemester,
  onModeChange,
  onArchiveChange,
  onExportSvg,
  onExportPng,
  onExportPlan,
  onExportFullDb,
}: HeaderProps) {
  const { t } = useI18n();
  const [exportOpen, setExportOpen] = useState(false);

  const yearChoices = [2026, 2025, 2024, 2023];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 px-3 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
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
          {mode === 'archive' ? (
            <>
              <select
                className="h-10 rounded-xl border border-border bg-white px-2 text-sm"
                value={archiveYear}
                onChange={(event) => onArchiveChange(Number(event.target.value), archiveSemester)}
              >
                {yearChoices.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-xl border border-border bg-white px-2 text-sm"
                value={archiveSemester}
                onChange={(event) => onArchiveChange(archiveYear, event.target.value as SemesterType)}
              >
                <option value="winter">WS</option>
                <option value="summer">SS</option>
              </select>
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
