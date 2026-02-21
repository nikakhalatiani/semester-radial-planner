import { useMemo, useState } from 'react';

import type {
  AdminChangelogEntry,
  CourseDefinition,
  CourseOffering,
  Professor,
  SemesterType,
} from '../../types';
import { OfferingEditModal } from './OfferingEditModal';

interface OfferingsPageProps {
  year: number;
  semester: SemesterType;
  offerings: CourseOffering[];
  definitions: CourseDefinition[];
  professors: Professor[];
  changelog: AdminChangelogEntry[];
  canEdit: boolean;
  onPeriodChange: (year: number, semester: SemesterType) => void;
  onSave: (offering: CourseOffering) => Promise<void>;
  onDelete: (offeringId: string) => Promise<void>;
}

export function OfferingsPage({
  year,
  semester,
  offerings,
  definitions,
  professors,
  changelog,
  canEdit,
  onPeriodChange,
  onSave,
  onDelete,
}: OfferingsPageProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseOffering | undefined>();
  const [modalVersion, setModalVersion] = useState(0);

  const yearChoices = [2026, 2025, 2024, 2023];

  const rows = useMemo(
    () =>
      offerings
        .filter((offering) => offering.academicYear === year && offering.semesterType === semester)
        .map((offering) => {
          const definition = definitions.find((item) => item.id === offering.courseDefinitionId);
          return {
            offering,
            definition,
          };
        }),
    [definitions, offerings, semester, year],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-xl border border-border px-2 dark:border-border-dark dark:bg-neutral-900"
            value={year}
            onChange={(event) => onPeriodChange(Number(event.target.value), semester)}
          >
            {yearChoices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-xl border border-border px-2 dark:border-border-dark dark:bg-neutral-900"
            value={semester}
            onChange={(event) => onPeriodChange(year, event.target.value as SemesterType)}
          >
            <option value="winter">Winter</option>
            <option value="summer">Summer</option>
          </select>
        </div>

        <button
          type="button"
          disabled={!canEdit}
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => {
            setEditing(undefined);
            setModalVersion((prev) => prev + 1);
            setOpen(true);
          }}
        >
          Add Offering
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border dark:border-border-dark">
        <table className="min-w-full divide-y divide-border text-sm dark:divide-border-dark">
          <thead className="bg-surface dark:bg-surface-dark">
            <tr>
              <th className="px-3 py-2 text-left">Course</th>
              <th className="px-3 py-2 text-left">Availability</th>
              <th className="px-3 py-2 text-left">Dates</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {rows.map((row) => (
              <tr key={row.offering.id}>
                <td className="px-3 py-2">{row.definition?.name ?? row.offering.courseDefinitionId}</td>
                <td className="px-3 py-2">{row.offering.isAvailable ? 'Available' : 'Not offered'}</td>
                <td className="px-3 py-2">
                  {row.offering.startDate.slice(0, 10)} - {row.offering.endDate.slice(0, 10)}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="rounded-lg border border-border px-2 py-1 text-xs dark:border-border-dark"
                    onClick={() => {
                      setEditing(row.offering);
                      setModalVersion((prev) => prev + 1);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="ml-2 rounded-lg border border-danger px-2 py-1 text-xs text-danger disabled:opacity-50"
                    onClick={() => void onDelete(row.offering.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OfferingEditModal
        key={`${editing?.id ?? 'new'}-${modalVersion}`}
        open={open}
        initial={editing}
        definitions={definitions}
        professors={professors}
        changelog={changelog}
        year={year}
        semester={semester}
        onClose={() => setOpen(false)}
        onSave={onSave}
      />
    </section>
  );
}
