import { useMemo, useState } from 'react';

import type {
  AdminChangelogEntry,
  CourseDefinition,
  CourseOffering,
  Professor,
  SemesterType,
} from '../../types';
import { ARCHIVE_YEAR_CHOICES_DESC, getAllowedSemestersForYear } from '../../utils/academicYears';
import { getLectureSessions } from '../../utils/lectureSchedule';
import { Dropdown } from '../ui/Dropdown';
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

  const yearChoices = ARCHIVE_YEAR_CHOICES_DESC;
  const yearOptions = yearChoices.map((choice) => ({ value: choice, label: String(choice) }));
  const semesterOptions: Array<{ value: SemesterType; label: string }> = getAllowedSemestersForYear(year).map(
    (value) => ({
      value,
      label: value === 'winter' ? 'Winter' : 'Summer',
    }),
  );

  const rows = useMemo(
    () =>
      offerings
        .filter((offering) => offering.academicYear === year && offering.semesterType === semester)
        .map((offering) => {
          const definition = definitions.find((item) => item.id === offering.courseDefinitionId);
          const lectureSessionCount = getLectureSessions(offering).length;
          return {
            offering,
            definition,
            lectureSessionCount,
          };
        }),
    [definitions, offerings, semester, year],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dropdown
            className="h-10 rounded-xl border border-border px-2"
            value={year}
            options={yearOptions}
            onChange={(nextYear) => onPeriodChange(nextYear, semester)}
          />
          <Dropdown
            className="h-10 rounded-xl border border-border px-2"
            value={semester}
            options={semesterOptions}
            onChange={(nextSemester) => onPeriodChange(year, nextSemester)}
          />
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

      <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600">
        Month grid lecture events use explicit lecture sessions (date/time) when configured. If empty, they are
        inferred weekly from `startDate`.
      </p>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border bg-white text-sm text-text-primary">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 text-left">Course</th>
              <th className="px-3 py-2 text-left">Availability</th>
              <th className="px-3 py-2 text-left">Dates</th>
              <th className="px-3 py-2 text-left">Lecture schedule</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.offering.id}>
                <td className="px-3 py-2">{row.definition?.name ?? row.offering.courseDefinitionId}</td>
                <td className="px-3 py-2">{row.offering.isAvailable ? 'Available' : 'Not offered'}</td>
                <td className="px-3 py-2">
                  {row.offering.startDate.slice(0, 10)} - {row.offering.endDate.slice(0, 10)}
                </td>
                <td className="px-3 py-2">
                  {row.lectureSessionCount > 0
                    ? `${row.lectureSessionCount} sessions`
                    : 'Inferred weekly'}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="rounded-lg border border-border px-2 py-1 text-xs"
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
