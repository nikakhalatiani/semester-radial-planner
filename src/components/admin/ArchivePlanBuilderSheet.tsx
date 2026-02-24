import { useMemo, useState } from 'react';

import { useI18n } from '../../hooks/useI18n';
import { useProgramRules } from '../../hooks/useProgramRules';
import type {
  CourseCategory,
  CourseDefinition,
  CourseOffering,
  MastersProgramRule,
  Professor,
  RadialDisplayOffering,
  SelectedOffering,
  SemesterType,
  University,
  UserPlan,
} from '../../types';
import {
  ARCHIVE_YEAR_CHOICES_DESC,
  getAllowedSemestersForYear,
  normalizeSemesterForYear,
} from '../../utils/academicYears';
import { BottomSheet } from '../ui/BottomSheet';
import { Dropdown } from '../ui/Dropdown';
import { PlanningPanel, type PlanningRow } from '../planning/PlanningPanel';
import { PlanningRulesCollapsedPreview, PlanningRulesPanel } from '../planning/PlanningRulesPanel';
import { RulesOverlayPanel } from '../planning/RulesOverlayPanel';
import { RadialCalendar } from '../calendar/RadialCalendar';

interface ArchivePlanBuilderSheetProps {
  open: boolean;
  initial?: UserPlan;
  defaultYear: number;
  defaultSemester: SemesterType;
  offerings: CourseOffering[];
  definitions: CourseDefinition[];
  universities: University[];
  professors: Professor[];
  rules: MastersProgramRule[];
  onClose: () => void;
  onSave: (plan: UserPlan) => Promise<void>;
}

const ALL_CATEGORIES: CourseCategory[] = ['FM', 'SE', 'HCI', 'DB', 'DS', 'SS'];

function isArchivePlanName(name: string): boolean {
  return /^archive\b/i.test(name.trim());
}

function normalizeArchivePlanName(name: string, year: number, semester: SemesterType): string {
  const trimmed = name.trim();
  const defaultName = `Archive ${semester === 'winter' ? 'WS' : 'SS'} ${year}`;
  if (!trimmed) {
    return defaultName;
  }
  return isArchivePlanName(trimmed) ? trimmed : `Archive ${trimmed}`;
}

function sortOfferingsForPeriod(offerings: CourseOffering[]): CourseOffering[] {
  return [...offerings].sort((a, b) => {
    const dateDiff = a.startDate.localeCompare(b.startDate);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return a.id.localeCompare(b.id);
  });
}

function getPeriodOfferings(
  offerings: CourseOffering[],
  year: number,
  semester: SemesterType,
): CourseOffering[] {
  return sortOfferingsForPeriod(
    offerings.filter(
      (offering) => offering.academicYear === year && offering.semesterType === semester,
    ),
  );
}

function buildSelections(
  offerings: CourseOffering[],
  existing: SelectedOffering[] = [],
): SelectedOffering[] {
  const existingById = new Map(existing.map((selection) => [selection.offeringId, selection]));
  return offerings.map((offering, index) => {
    const prev = existingById.get(offering.id);
    const defaultExamOptionId =
      offering.examOptions.find((option) => option.isDefault)?.id ?? offering.examOptions[0]?.id ?? '';
    return {
      offeringId: offering.id,
      selectedExamOptionId:
        prev && offering.examOptions.some((option) => option.id === prev.selectedExamOptionId)
          ? prev.selectedExamOptionId
          : defaultExamOptionId,
      isIncluded: prev?.isIncluded ?? false,
      displayOrder: prev?.displayOrder ?? index,
    };
  });
}

function createDraftPlan(
  offerings: CourseOffering[],
  rules: MastersProgramRule[],
  year: number,
  semester: SemesterType,
  initial?: UserPlan,
): UserPlan {
  const now = new Date().toISOString();
  const normalizedSemester = normalizeSemesterForYear(year, semester);
  const periodOfferings = getPeriodOfferings(offerings, year, normalizedSemester);
  const selections = buildSelections(periodOfferings, initial?.selectedOfferings ?? []);
  return {
    id: initial?.id ?? '',
    name: normalizeArchivePlanName(
      initial?.name ?? '',
      year,
      normalizedSemester,
    ),
    academicYear: year,
    semesterType: normalizedSemester,
    programRuleId:
      initial?.programRuleId ||
      rules.find((rule) => rule.isActive)?.id ||
      rules[0]?.id ||
      '',
    selectedOfferings: selections,
    createdAt: initial?.createdAt ?? now,
    updatedAt: now,
  };
}

export function ArchivePlanBuilderSheet({
  open,
  initial,
  defaultYear,
  defaultSemester,
  offerings,
  definitions,
  universities,
  professors,
  rules,
  onClose,
  onSave,
}: ArchivePlanBuilderSheetProps) {
  const { language } = useI18n();
  const initialYear = initial?.academicYear ?? defaultYear;
  const initialSemester = initial?.semesterType ?? normalizeSemesterForYear(initialYear, defaultSemester);

  const [draft, setDraft] = useState<UserPlan>(() =>
    createDraftPlan(offerings, rules, initialYear, initialSemester, initial),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<CourseCategory[]>(ALL_CATEGORIES);

  const periodOfferings = useMemo(
    () => getPeriodOfferings(offerings, draft.academicYear, draft.semesterType),
    [draft.academicYear, draft.semesterType, offerings],
  );

  const definitionById = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  );
  const universityById = useMemo(
    () => new Map(universities.map((university) => [university.id, university])),
    [universities],
  );
  const professorById = useMemo(
    () => new Map(professors.map((professor) => [professor.id, professor])),
    [professors],
  );
  const selectionByOfferingId = useMemo(
    () => new Map(draft.selectedOfferings.map((selection) => [selection.offeringId, selection])),
    [draft.selectedOfferings],
  );

  const planningRows = useMemo<PlanningRow[]>(() => {
    const rows: PlanningRow[] = [];
    periodOfferings.forEach((offering) => {
      const definition = definitionById.get(offering.courseDefinitionId);
      if (!definition || definition.isArchived) {
        return;
      }
      if (definition.category && !categoryFilters.includes(definition.category)) {
        return;
      }
      if (
        searchQuery &&
        !definition.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !definition.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return;
      }
      const professorIds =
        offering.professorIds && offering.professorIds.length > 0
          ? offering.professorIds
          : definition.professorIds;
      const professorNames = professorIds
        .map((id) => professorById.get(id)?.name)
        .filter((name): name is string => Boolean(name))
        .join(', ');
      rows.push({
        definition,
        offering,
        programSemester: draft.programSemester,
        selection: selectionByOfferingId.get(offering.id),
        university: definition.universityId
          ? universityById.get(definition.universityId)
          : undefined,
        professorNames,
      });
    });
    return rows.sort((a, b) => {
      const orderA = a.selection?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.selection?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.definition.name.localeCompare(b.definition.name);
    });
  }, [
    categoryFilters,
    definitionById,
    draft.programSemester,
    periodOfferings,
    professorById,
    searchQuery,
    selectionByOfferingId,
    universityById,
  ]);

  const displayOfferings = useMemo<RadialDisplayOffering[]>(() => {
    const rows: RadialDisplayOffering[] = [];
    draft.selectedOfferings
      .filter((selection) => selection.isIncluded)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((selection) => {
        const offering = periodOfferings.find((item) => item.id === selection.offeringId);
        if (!offering) {
          return;
        }
        const definition = definitionById.get(offering.courseDefinitionId);
        if (!definition) {
          return;
        }
        rows.push({
          offering,
          definition,
          selectedExamOption:
            offering.examOptions.find((option) => option.id === selection.selectedExamOptionId) ??
            offering.examOptions.find((option) => option.isDefault) ??
            offering.examOptions[0],
          displayOrder: selection.displayOrder,
        });
      });
    return rows;
  }, [definitionById, draft.selectedOfferings, periodOfferings]);

  const activeRule = rules.find((rule) => rule.id === draft.programRuleId);
  const ruleResult = useProgramRules({
    rule: activeRule,
    selections: draft.selectedOfferings,
    offerings: periodOfferings,
    definitions,
    language,
  });

  const yearOptions = useMemo(
    () => ARCHIVE_YEAR_CHOICES_DESC.map((year) => ({ value: year, label: String(year) })),
    [],
  );
  const semesterOptions = useMemo(
    () =>
      getAllowedSemestersForYear(draft.academicYear).map((semester) => ({
        value: semester,
        label: semester === 'winter' ? 'Winter' : 'Summer',
      })),
    [draft.academicYear],
  );
  const ruleOptions = useMemo(
    () =>
      rules.map((rule) => ({
        value: rule.id,
        label: `${rule.programName} (${rule.version})`,
      })),
    [rules],
  );

  const setPeriod = (year: number, semester: SemesterType) => {
    const normalizedSemester = normalizeSemesterForYear(year, semester);
    const periodItems = getPeriodOfferings(offerings, year, normalizedSemester);
    setDraft((prev) => ({
      ...prev,
      academicYear: year,
      semesterType: normalizedSemester,
      name: normalizeArchivePlanName(prev.name, year, normalizedSemester),
      selectedOfferings: buildSelections(periodItems, prev.selectedOfferings),
    }));
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Archive Plan (Planner)' : 'Create Archive Plan (Planner)'}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]">
          <label className="block text-sm">
            Plan Name
            <input
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            Year
            <Dropdown
              className="mt-1 h-11 w-full rounded-xl border border-border px-2"
              value={draft.academicYear}
              options={yearOptions}
              onChange={(nextYear) => setPeriod(nextYear, draft.semesterType)}
            />
          </label>
          <label className="block text-sm">
            Semester
            <Dropdown
              className="mt-1 h-11 w-full rounded-xl border border-border px-2"
              value={draft.semesterType}
              options={semesterOptions}
              onChange={(nextSemester) => setPeriod(draft.academicYear, nextSemester)}
            />
          </label>
        </div>

        <label className="block text-sm">
          Program Rule
          <Dropdown
            className="mt-1 h-11 w-full rounded-xl border border-border px-2"
            value={draft.programRuleId}
            options={ruleOptions.length > 0 ? ruleOptions : [{ value: '', label: 'No rules available' }]}
            onChange={(programRuleId) => setDraft((prev) => ({ ...prev, programRuleId }))}
            disabled={ruleOptions.length === 0}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
          <PlanningPanel
            rows={planningRows}
            searchQuery={searchQuery}
            activeCategories={categoryFilters}
            onSearch={setSearchQuery}
            onToggleCategory={(category) =>
              setCategoryFilters((current) =>
                current.includes(category)
                  ? current.filter((item) => item !== category)
                  : [...current, category],
              )
            }
            onToggleInclude={(offeringId, next) =>
              setDraft((prev) => {
                const existing = prev.selectedOfferings.find(
                  (selection) => selection.offeringId === offeringId,
                );
                const nextOrder =
                  prev.selectedOfferings
                    .filter(
                      (selection) =>
                        selection.isIncluded && selection.offeringId !== offeringId,
                    )
                    .reduce((max, selection) => Math.max(max, selection.displayOrder), -1) + 1;

                const nextSelection: SelectedOffering = existing
                  ? {
                      ...existing,
                      isIncluded: next,
                      displayOrder:
                        next && !existing.isIncluded ? nextOrder : existing.displayOrder,
                    }
                  : {
                      offeringId,
                      selectedExamOptionId: '',
                      isIncluded: next,
                      displayOrder: nextOrder,
                    };

                return {
                  ...prev,
                  selectedOfferings: [
                    ...prev.selectedOfferings.filter(
                      (selection) => selection.offeringId !== offeringId,
                    ),
                    nextSelection,
                  ],
                };
              })
            }
            className="flex h-[calc(100vh-220px)] flex-col"
            cardsClassName="min-h-0 flex-1 pr-1"
          />

          <div className="space-y-3">
            <div className="min-h-[520px]">
              <RadialCalendar
                year={draft.academicYear}
                offerings={displayOfferings}
                onSelectOffering={() => {
                  // No detail sheet inside admin builder preview.
                }}
                availableYears={ARCHIVE_YEAR_CHOICES_DESC}
              />
            </div>

            <RulesOverlayPanel
              collapsedContent={({ toggle }) => (
                <PlanningRulesCollapsedPreview
                  ruleResult={ruleResult}
                  showScope={false}
                  onExpand={toggle}
                />
              )}
            >
              <PlanningRulesPanel
                ruleResult={ruleResult}
                showScope={false}
                checkerExpandable={false}
                className="border-0 bg-transparent p-0"
              />
            </RulesOverlayPanel>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-secondary">
            This uses the same include/exclude planning workflow and saves as an archive plan.
          </p>
          <button
            type="button"
            className="h-11 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white"
            onClick={async () => {
              const periodItems = getPeriodOfferings(
                offerings,
                draft.academicYear,
                draft.semesterType,
              );
              const now = new Date().toISOString();
              const payload: UserPlan = {
                ...draft,
                id: draft.id || `plan-${Date.now()}`,
                name: normalizeArchivePlanName(
                  draft.name,
                  draft.academicYear,
                  draft.semesterType,
                ),
                selectedOfferings: buildSelections(periodItems, draft.selectedOfferings),
                createdAt: draft.createdAt || now,
                updatedAt: now,
              };
              await onSave(payload);
              onClose();
            }}
          >
            Save Archive Plan
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
