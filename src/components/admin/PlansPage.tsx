import { useMemo, useState } from 'react';

import type {
  CourseDefinition,
  CourseOffering,
  MastersProgramRule,
  Professor,
  SemesterType,
  University,
  UserPlan,
} from '../../types';
import {
  ARCHIVE_YEAR_CHOICES_DESC,
  getAllowedSemestersForYear,
  normalizeSemesterForYear,
} from '../../utils/academicYears';
import { Dropdown } from '../ui/Dropdown';
import { ArchivePlanBuilderSheet } from './ArchivePlanBuilderSheet';

interface PlansPageProps {
  plans: UserPlan[];
  offerings: CourseOffering[];
  definitions: CourseDefinition[];
  universities: University[];
  professors: Professor[];
  rules: MastersProgramRule[];
  canEdit: boolean;
  onSave: (plan: UserPlan) => Promise<void>;
  onDelete: (planId: string) => Promise<void>;
}

function isArchivePlanName(name: string): boolean {
  return /^archive\b/i.test(name.trim());
}

const INITIAL_ARCHIVE_YEAR =
  ARCHIVE_YEAR_CHOICES_DESC[ARCHIVE_YEAR_CHOICES_DESC.length - 1] ?? 2025;

export function PlansPage({
  plans,
  offerings,
  definitions,
  universities,
  professors,
  rules,
  canEdit,
  onSave,
  onDelete,
}: PlansPageProps) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderInitial, setBuilderInitial] = useState<UserPlan | undefined>();
  const [yearFilter, setYearFilter] = useState<number>(INITIAL_ARCHIVE_YEAR);
  const [semesterFilter, setSemesterFilter] = useState<SemesterType>(
    normalizeSemesterForYear(INITIAL_ARCHIVE_YEAR, 'winter'),
  );

  const yearOptions = useMemo(
    () => ARCHIVE_YEAR_CHOICES_DESC.map((year) => ({ value: year, label: String(year) })),
    [],
  );
  const semesterOptions = useMemo(
    () =>
      getAllowedSemestersForYear(yearFilter).map((semester) => ({
        value: semester,
        label: semester === 'winter' ? 'Winter' : 'Summer',
      })),
    [yearFilter],
  );

  const offeringById = useMemo(
    () => new Map(offerings.map((offering) => [offering.id, offering])),
    [offerings],
  );

  const archivePlans = useMemo(
    () => plans.filter((plan) => isArchivePlanName(plan.name)),
    [plans],
  );

  const rows = useMemo(
    () =>
      archivePlans
        .filter((plan) => plan.academicYear === yearFilter && plan.semesterType === semesterFilter)
        .map((plan) => {
          const includedCount = plan.selectedOfferings.filter((selection) => selection.isIncluded).length;
          const matchedOfferingCount = plan.selectedOfferings.filter((selection) => {
            const offering = offeringById.get(selection.offeringId);
            return Boolean(
              offering &&
              offering.academicYear === plan.academicYear &&
              offering.semesterType === plan.semesterType,
            );
          }).length;

          return {
            plan,
            includedCount,
            matchedOfferingCount,
          };
        })
        .sort((a, b) => b.plan.updatedAt.localeCompare(a.plan.updatedAt)),
    [archivePlans, offeringById, semesterFilter, yearFilter],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dropdown
            className="h-10 rounded-xl border border-border px-2"
            value={yearFilter}
            options={yearOptions}
            onChange={(nextYear) => {
              setYearFilter(nextYear);
              setSemesterFilter((prev) => normalizeSemesterForYear(nextYear, prev));
            }}
          />
          <Dropdown
            className="h-10 rounded-xl border border-border px-2"
            value={semesterFilter}
            options={semesterOptions}
            onChange={setSemesterFilter}
          />
        </div>

        <button
          type="button"
          disabled={!canEdit}
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => {
            setBuilderInitial(undefined);
            setBuilderOpen(true);
          }}
        >
          Create Archive Plan
        </button>
      </div>

      <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
        Create and edit archive plans using the same planning workflow as user Planning mode, scoped to the selected
        past semester.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border bg-white text-sm text-text-primary">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Period</th>
              <th className="px-3 py-2 text-left">Included Courses</th>
              <th className="px-3 py-2 text-left">Updated</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-sm text-text-secondary" colSpan={5}>
                  No archive plans for this period.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.plan.id}>
                  <td className="px-3 py-2">{row.plan.name}</td>
                  <td className="px-3 py-2">
                    {row.plan.semesterType === 'winter' ? 'WS' : 'SS'} {row.plan.academicYear}
                  </td>
                  <td className="px-3 py-2">
                    {row.includedCount}/{row.matchedOfferingCount}
                  </td>
                  <td className="px-3 py-2">{row.plan.updatedAt.slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={!canEdit}
                        className="whitespace-nowrap rounded-lg border border-border px-2 py-1 text-xs"
                        onClick={() => {
                          setBuilderInitial(row.plan);
                          setBuilderOpen(true);
                        }}
                      >
                        Open Planner
                      </button>
                      <button
                        type="button"
                        disabled={!canEdit}
                        className="whitespace-nowrap rounded-lg border border-danger px-2 py-1 text-xs text-danger disabled:opacity-50"
                        onClick={() => void onDelete(row.plan.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {builderOpen ? (
        <ArchivePlanBuilderSheet
          open={builderOpen}
          initial={builderInitial}
          defaultYear={yearFilter}
          defaultSemester={semesterFilter}
          offerings={offerings}
          definitions={definitions}
          universities={universities}
          professors={professors}
          rules={rules}
          onClose={() => setBuilderOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </section>
  );
}
