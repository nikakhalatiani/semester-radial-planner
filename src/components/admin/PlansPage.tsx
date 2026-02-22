import clsx from 'clsx';
import { useMemo, useState } from 'react';

import type {
  CourseDefinition,
  CourseOffering,
  MastersProgramRule,
  SelectedOffering,
  SemesterType,
  UserPlan,
} from '../../types';
import {
  ARCHIVE_YEAR_CHOICES_DESC,
  getAllowedSemestersForYear,
  normalizeSemesterForYear,
} from '../../utils/academicYears';
import { BottomSheet } from '../ui/BottomSheet';
import { Dropdown } from '../ui/Dropdown';

interface PlansPageProps {
  plans: UserPlan[];
  offerings: CourseOffering[];
  definitions: CourseDefinition[];
  rules: MastersProgramRule[];
  canEdit: boolean;
  onSave: (plan: UserPlan) => Promise<void>;
  onDelete: (planId: string) => Promise<void>;
}

interface PlanEditModalProps {
  open: boolean;
  canEdit: boolean;
  initial?: UserPlan;
  defaultYear: number;
  defaultSemester: SemesterType;
  offerings: CourseOffering[];
  definitions: CourseDefinition[];
  rules: MastersProgramRule[];
  onClose: () => void;
  onSave: (plan: UserPlan) => Promise<void>;
}

function isArchivePlanName(name: string): boolean {
  return /^archive\b/i.test(name.trim());
}

function getArchivePlanName(year: number, semester: SemesterType): string {
  const semesterLabel = semester === 'winter' ? 'WS' : 'SS';
  return `Archive ${semesterLabel} ${year}`;
}

function normalizeArchivePlanName(name: string, year: number, semester: SemesterType): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return getArchivePlanName(year, semester);
  }

  if (isArchivePlanName(trimmed)) {
    return trimmed;
  }

  return `Archive ${trimmed}`;
}

function sortOfferingsForPlan(offerings: CourseOffering[]): CourseOffering[] {
  return [...offerings].sort((a, b) => {
    const dateDiff = a.startDate.localeCompare(b.startDate);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return a.id.localeCompare(b.id);
  });
}

function getOfferingsForPeriod(
  offerings: CourseOffering[],
  year: number,
  semester: SemesterType,
): CourseOffering[] {
  return sortOfferingsForPlan(
    offerings.filter((offering) => offering.academicYear === year && offering.semesterType === semester),
  );
}

function buildSelectionsForPeriod(
  offerings: CourseOffering[],
  year: number,
  semester: SemesterType,
  existingSelections: SelectedOffering[],
  defaultIncluded: boolean,
): SelectedOffering[] {
  const periodOfferings = getOfferingsForPeriod(offerings, year, semester);
  const existingByOfferingId = new Map(
    existingSelections.map((selection) => [selection.offeringId, selection]),
  );

  return periodOfferings.map((offering, index) => {
    const existing = existingByOfferingId.get(offering.id);
    const defaultExamOptionId =
      offering.examOptions.find((option) => option.isDefault)?.id ?? offering.examOptions[0]?.id ?? '';
    const selectedExamOptionId =
      existing && offering.examOptions.some((option) => option.id === existing.selectedExamOptionId)
        ? existing.selectedExamOptionId
        : defaultExamOptionId;

    return {
      offeringId: offering.id,
      selectedExamOptionId,
      isIncluded: existing?.isIncluded ?? defaultIncluded,
      displayOrder: index,
    };
  });
}

function PlanEditModal({
  open,
  canEdit,
  initial,
  defaultYear,
  defaultSemester,
  offerings,
  definitions,
  rules,
  onClose,
  onSave,
}: PlanEditModalProps) {
  const [form, setForm] = useState<UserPlan>(() => {
    if (initial) {
      return {
        ...initial,
        name: normalizeArchivePlanName(initial.name, initial.academicYear, initial.semesterType),
        selectedOfferings: buildSelectionsForPeriod(
          offerings,
          initial.academicYear,
          initial.semesterType,
          initial.selectedOfferings,
          true,
        ),
      };
    }

    const normalizedSemester = normalizeSemesterForYear(defaultYear, defaultSemester);
    const now = new Date().toISOString();
    return {
      id: '',
      name: getArchivePlanName(defaultYear, normalizedSemester),
      academicYear: defaultYear,
      semesterType: normalizedSemester,
      programRuleId: rules.find((rule) => rule.isActive)?.id ?? rules[0]?.id ?? '',
      selectedOfferings: buildSelectionsForPeriod(offerings, defaultYear, normalizedSemester, [], true),
      createdAt: now,
      updatedAt: now,
    };
  });

  const yearOptions = useMemo(
    () => ARCHIVE_YEAR_CHOICES_DESC.map((year) => ({ value: year, label: String(year) })),
    [],
  );
  const semesterOptions = useMemo(
    () =>
      getAllowedSemestersForYear(form.academicYear).map((value) => ({
        value,
        label: value === 'winter' ? 'Winter' : 'Summer',
      })),
    [form.academicYear],
  );
  const ruleOptions = useMemo(
    () =>
      rules.map((rule) => ({
        value: rule.id,
        label: `${rule.programName} (${rule.version})`,
      })),
    [rules],
  );

  const offeringsForPeriod = useMemo(
    () => getOfferingsForPeriod(offerings, form.academicYear, form.semesterType),
    [form.academicYear, form.semesterType, offerings],
  );
  const selectionByOfferingId = useMemo(
    () => new Map(form.selectedOfferings.map((selection) => [selection.offeringId, selection])),
    [form.selectedOfferings],
  );
  const definitionById = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  );

  const setPeriod = (nextYear: number, nextSemester: SemesterType) => {
    setForm((prev) => ({
      ...prev,
      academicYear: nextYear,
      semesterType: nextSemester,
      selectedOfferings: buildSelectionsForPeriod(
        offerings,
        nextYear,
        nextSemester,
        prev.selectedOfferings,
        true,
      ),
    }));
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit Archive Plan' : 'Create Archive Plan'}>
      <div className="space-y-3">
        <label className="block text-sm">
          Plan Name
          <input
            type="text"
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            Year
            <Dropdown
              className="mt-1 h-11 rounded-xl border border-border px-2"
              value={form.academicYear}
              options={yearOptions}
              onChange={(nextYear) => {
                const nextSemester = normalizeSemesterForYear(nextYear, form.semesterType);
                setPeriod(nextYear, nextSemester);
              }}
            />
          </label>

          <label className="block text-sm">
            Semester
            <Dropdown
              className="mt-1 h-11 rounded-xl border border-border px-2"
              value={form.semesterType}
              options={semesterOptions}
              onChange={(nextSemester) => setPeriod(form.academicYear, nextSemester)}
            />
          </label>

          <label className="block text-sm">
            Program Rule
            <Dropdown
              className="mt-1 h-11 rounded-xl border border-border px-2"
              value={form.programRuleId}
              options={
                ruleOptions.length > 0
                  ? ruleOptions
                  : [{ value: '', label: 'No rules available' }]
              }
              onChange={(programRuleId) => setForm((prev) => ({ ...prev, programRuleId }))}
              disabled={ruleOptions.length === 0}
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1 text-xs"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                selectedOfferings: prev.selectedOfferings.map((selection) => ({
                  ...selection,
                  isIncluded: true,
                })),
              }))
            }
          >
            Include all
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1 text-xs"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                selectedOfferings: prev.selectedOfferings.map((selection) => ({
                  ...selection,
                  isIncluded: false,
                })),
              }))
            }
          >
            Exclude all
          </button>
        </div>

        <div className="max-h-[46vh] overflow-y-auto rounded-2xl border border-border">
          <table className="min-w-full divide-y divide-border bg-white text-sm text-text-primary">
            <thead className="bg-surface">
              <tr>
                <th className="px-3 py-2 text-left">Course</th>
                <th className="px-3 py-2 text-left">Include</th>
                <th className="px-3 py-2 text-left">Exam Option</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {offeringsForPeriod.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-sm text-text-secondary" colSpan={3}>
                    No offerings in this period.
                  </td>
                </tr>
              ) : (
                offeringsForPeriod.map((offering) => {
                  const selection = selectionByOfferingId.get(offering.id);
                  const selectedExamId =
                    selection?.selectedExamOptionId ??
                    offering.examOptions.find((option) => option.isDefault)?.id ??
                    offering.examOptions[0]?.id ??
                    '';
                  const definition = definitionById.get(offering.courseDefinitionId);
                  const examOptionChoices = offering.examOptions.map((option) => ({
                    value: option.id,
                    label: `${option.type} ${option.date.slice(0, 10)}`,
                  }));

                  return (
                    <tr key={offering.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{definition?.name ?? offering.courseDefinitionId}</p>
                        <p className="text-xs text-text-secondary">{offering.startDate.slice(0, 10)} to {offering.endDate.slice(0, 10)}</p>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className={clsx(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            selection?.isIncluded
                              ? 'bg-success text-white'
                              : 'bg-neutral-200 text-neutral-700',
                          )}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              selectedOfferings: prev.selectedOfferings.map((item) =>
                                item.offeringId === offering.id
                                  ? { ...item, isIncluded: !item.isIncluded }
                                  : item,
                              ),
                            }))
                          }
                        >
                          {selection?.isIncluded ? 'Included' : 'Excluded'}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        {examOptionChoices.length > 0 ? (
                          <Dropdown
                            className="h-10 rounded-xl border border-border px-2"
                            value={selectedExamId}
                            options={examOptionChoices}
                            onChange={(selectedExamOptionId) =>
                              setForm((prev) => ({
                                ...prev,
                                selectedOfferings: prev.selectedOfferings.map((item) =>
                                  item.offeringId === offering.id
                                    ? { ...item, selectedExamOptionId }
                                    : item,
                                ),
                              }))
                            }
                          />
                        ) : (
                          <p className="text-xs text-text-secondary">No exam options</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!canEdit}
          onClick={async () => {
            const now = new Date().toISOString();
            const nextPlan: UserPlan = {
              ...form,
              id: form.id || `plan-${Date.now()}`,
              name: normalizeArchivePlanName(form.name, form.academicYear, form.semesterType),
              programRuleId: form.programRuleId || rules.find((rule) => rule.isActive)?.id || rules[0]?.id || '',
              selectedOfferings: buildSelectionsForPeriod(
                offerings,
                form.academicYear,
                form.semesterType,
                form.selectedOfferings,
                true,
              ),
              createdAt: form.createdAt || now,
              updatedAt: now,
            };
            await onSave(nextPlan);
            onClose();
          }}
        >
          Save Archive Plan
        </button>
      </div>
    </BottomSheet>
  );
}

export function PlansPage({
  plans,
  offerings,
  definitions,
  rules,
  canEdit,
  onSave,
  onDelete,
}: PlansPageProps) {
  const [editing, setEditing] = useState<UserPlan | undefined>();
  const [open, setOpen] = useState(false);
  const [modalVersion, setModalVersion] = useState(0);
  const [yearFilter, setYearFilter] = useState<number>(ARCHIVE_YEAR_CHOICES_DESC[0] ?? 2025);
  const [semesterFilter, setSemesterFilter] = useState<SemesterType>('winter');

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
        }),
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
              const nextSemester = normalizeSemesterForYear(nextYear, semesterFilter);
              setSemesterFilter(nextSemester);
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
            setEditing(undefined);
            setModalVersion((prev) => prev + 1);
            setOpen(true);
          }}
        >
          Add Archive Plan
        </button>
      </div>

      <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
        Archive mode uses the latest updated archive plan for the selected year/semester (plan name must start with
        `Archive`).
      </p>

      <div className="overflow-hidden rounded-2xl border border-border">
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
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={!canEdit}
                      className="rounded-lg border border-border px-2 py-1 text-xs"
                      onClick={() => {
                        setEditing(row.plan);
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
                      onClick={() => void onDelete(row.plan.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlanEditModal
        key={`${editing?.id ?? 'new'}-${modalVersion}`}
        open={open}
        canEdit={canEdit}
        initial={editing}
        defaultYear={yearFilter}
        defaultSemester={semesterFilter}
        offerings={offerings}
        definitions={definitions}
        rules={rules}
        onClose={() => setOpen(false)}
        onSave={onSave}
      />
    </section>
  );
}
