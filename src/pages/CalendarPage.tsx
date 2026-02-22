import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { RadialCalendar } from '../components/calendar/RadialCalendar';
import { CalendarSwitcher } from '../components/layout/CalendarSwitcher';
import { Header } from '../components/layout/Header';
import { MobileNavBar } from '../components/layout/MobileNavBar';
import { NewPlanModal } from '../components/modals/NewPlanModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { PlanningPanel, type PlanningRow } from '../components/planning/PlanningPanel';
import { BottomSheet } from '../components/ui/BottomSheet';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { UniversityTag } from '../components/ui/UniversityTag';
import { useDragOrder } from '../hooks/useDragOrder';
import { useProgramRules } from '../hooks/useProgramRules';
import { useAppStore } from '../store';
import type { AppMode, RadialDisplayOffering, SemesterType, UserPlan } from '../types';
import {
  ARCHIVE_YEAR_CHOICES_DESC,
  PLANNING_YEAR,
  isAllowedAcademicYear,
  normalizeAcademicYear,
} from '../utils/academicYears';
import { exportActivePlan, exportFullDatabase, exportPng, exportSvg } from '../utils/export';
import { formatTimeRange, getLectureSessions } from '../utils/lectureSchedule';
const PLANNING_YEAR_CHOICES = [PLANNING_YEAR];

function inferSemester(date: Date): SemesterType {
  const month = date.getMonth() + 1;
  return month >= 4 && month <= 9 ? 'summer' : 'winter';
}

function semesterRank(semester: SemesterType): number {
  return semester === 'winter' ? 0 : 1;
}

function getPlanById(plans: UserPlan[], planId?: string) {
  return plans.find((plan) => plan.id === planId) ?? plans[0];
}

function isArchivePlanName(name: string): boolean {
  return /^archive\b/i.test(name.trim());
}

export function CalendarPage() {
  const {
    mode,
    setMode,
    archiveYear,
    archiveSemester,
    setArchivePeriod,
    selectedOfferingId,
    setSelectedOfferingId,
    appSettings,
    setLanguage,
    courseDefinitions,
    courseOfferings,
    professors,
    universities,
    programRules,
    userPlans,
    activePlanId,
    setActivePlanId,
    setActivePlanInSettings,
    planningSearchQuery,
    planningCategoryFilters,
    setPlanningSearchQuery,
    togglePlanningCategory,
    createPlan,
    upsertPlanSelection,
    upsertPlanSelectionsBulk,
    reorderPlanSelections,
    exportDatabase,
  } = useAppStore((state) => state);

  const reorderByOfferingId = useDragOrder();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);

  const planningEligiblePlans = useMemo(
    () => userPlans.filter((plan) => plan.academicYear === PLANNING_YEAR),
    [userPlans],
  );
  const activePlan = getPlanById(planningEligiblePlans, activePlanId);
  const activeRule = programRules.find((rule) => rule.id === (activePlan?.programRuleId ?? appSettings.activeProgramRuleId));

  useEffect(() => {
    const hasPlanningYearPlan = userPlans.some((plan) => plan.academicYear === PLANNING_YEAR);
    if (hasPlanningYearPlan || courseOfferings.length === 0) {
      return;
    }

    void createPlan('Current Plan', PLANNING_YEAR, inferSemester(new Date()));
  }, [courseOfferings.length, createPlan, userPlans]);

  useEffect(() => {
    if (activePlan || planningEligiblePlans.length === 0) {
      return;
    }

    const fallbackPlan = planningEligiblePlans[0];
    setActivePlanId(fallbackPlan.id);
    setActivePlanInSettings(fallbackPlan.id);
  }, [activePlan, planningEligiblePlans, setActivePlanId, setActivePlanInSettings]);

  useEffect(() => {
    if (isAllowedAcademicYear(archiveYear)) {
      return;
    }

    setArchivePeriod(normalizeAcademicYear(archiveYear), archiveSemester);
  }, [archiveSemester, archiveYear, setArchivePeriod]);

  const planOfferings = useMemo(() => {
    if (!activePlan) {
      return [];
    }
    return courseOfferings
      .filter((offering) => offering.academicYear === activePlan.academicYear)
      .sort((a, b) => {
        const semesterDiff = semesterRank(a.semesterType) - semesterRank(b.semesterType);
        if (semesterDiff !== 0) {
          return semesterDiff;
        }
        const dateDiff = a.startDate.localeCompare(b.startDate);
        if (dateDiff !== 0) {
          return dateDiff;
        }
        return a.id.localeCompare(b.id);
      });
  }, [activePlan, courseOfferings]);

  const activeArchivePlan = useMemo(() => {
    const matching = userPlans.filter(
      (plan) =>
        plan.academicYear === archiveYear &&
        plan.semesterType === archiveSemester &&
        isArchivePlanName(plan.name),
    );
    return matching[0];
  }, [archiveSemester, archiveYear, userPlans]);

  useEffect(() => {
    if (!activePlan) {
      return;
    }

    const selectionMap = new Map(activePlan.selectedOfferings.map((selection) => [selection.offeringId, selection]));
    const missingSelections = planOfferings
      .map((offering, index) => ({ offering, index }))
      .filter(({ offering }) => !selectionMap.has(offering.id))
      .map(({ offering, index }) => ({
        offeringId: offering.id,
        updates: {
          selectedExamOptionId:
            offering.examOptions.find((option) => option.isDefault)?.id ?? offering.examOptions[0]?.id ?? '',
          isIncluded: false,
          displayOrder: index,
        },
      }));

    if (missingSelections.length === 0) {
      return;
    }

    void upsertPlanSelectionsBulk(activePlan.id, missingSelections);
  }, [activePlan, planOfferings, upsertPlanSelectionsBulk]);

  const planningRows = useMemo<PlanningRow[]>(() => {
    if (!activePlan) {
      return [];
    }

    const selectionByOfferingId = new Map(
      activePlan.selectedOfferings.map((selection) => [selection.offeringId, selection]),
    );
    const definitionById = new Map(courseDefinitions.map((definition) => [definition.id, definition]));
    const universityById = new Map(universities.map((university) => [university.id, university]));
    const professorById = new Map(professors.map((professor) => [professor.id, professor]));

    const rows: PlanningRow[] = [];

    planOfferings.forEach((offering) => {
      const definition = definitionById.get(offering.courseDefinitionId);
      if (!definition || definition.isArchived) {
        return;
      }

      if (definition.category && !planningCategoryFilters.includes(definition.category)) {
        return;
      }

      if (
        planningSearchQuery &&
        !definition.name.toLowerCase().includes(planningSearchQuery.toLowerCase()) &&
        !definition.shortCode.toLowerCase().includes(planningSearchQuery.toLowerCase())
      ) {
        return;
      }

      const professorsForOffering =
        offering.professorIds && offering.professorIds.length > 0 ? offering.professorIds : definition.professorIds;

      const professorNames = professorsForOffering
        .map((id) => professorById.get(id)?.name)
        .filter((name): name is string => Boolean(name))
        .join(', ');

      rows.push({
        definition,
        offering,
        selection: selectionByOfferingId.get(offering.id),
        university: definition.universityId ? universityById.get(definition.universityId) : undefined,
        professorNames,
      });
    });

    return rows.sort((a, b) => {
      const semesterDiff = semesterRank(a.offering.semesterType) - semesterRank(b.offering.semesterType);
      if (semesterDiff !== 0) {
        return semesterDiff;
      }
      const orderA = a.selection?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.selection?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.definition.name.localeCompare(b.definition.name);
    });
  }, [
    activePlan,
    courseDefinitions,
    planOfferings,
    planningCategoryFilters,
    planningSearchQuery,
    professors,
    universities,
  ]);

  const fullViewOfferings = useMemo<RadialDisplayOffering[]>(() => {
    const definitionById = new Map(courseDefinitions.map((definition) => [definition.id, definition]));

    if (mode === 'archive') {
      const archiveOfferings = courseOfferings.filter(
        (offering) => offering.academicYear === archiveYear && offering.semesterType === archiveSemester,
      );
      const archiveOfferingById = new Map(archiveOfferings.map((offering) => [offering.id, offering]));

      if (activeArchivePlan) {
        const rowsFromPlan: RadialDisplayOffering[] = [];
        activeArchivePlan.selectedOfferings
          .filter((selection) => selection.isIncluded)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .forEach((selection) => {
            const offering = archiveOfferingById.get(selection.offeringId);
            if (!offering) {
              return;
            }
            const definition = definitionById.get(offering.courseDefinitionId);
            if (!definition) {
              return;
            }

            rowsFromPlan.push({
              offering,
              definition,
              selectedExamOption:
                offering.examOptions.find((option) => option.id === selection.selectedExamOptionId) ??
                offering.examOptions.find((option) => option.isDefault) ??
                offering.examOptions[0],
              displayOrder: selection.displayOrder,
            });
          });

        return rowsFromPlan;
      }

      const rowsFromOfferings: RadialDisplayOffering[] = [];
      archiveOfferings.forEach((offering, index) => {
        const definition = definitionById.get(offering.courseDefinitionId);
        if (!definition) {
          return;
        }

        rowsFromOfferings.push({
          offering,
          definition,
          selectedExamOption: offering.examOptions.find((option) => option.isDefault) ?? offering.examOptions[0],
          displayOrder: index,
        });
      });
      return rowsFromOfferings;
    }

    if (!activePlan) {
      return [];
    }

    const selectionByOfferingId = new Map(
      activePlan.selectedOfferings.map((selection) => [selection.offeringId, selection]),
    );

    const rows: RadialDisplayOffering[] = [];
    planOfferings.forEach((offering) => {
      const selection = selectionByOfferingId.get(offering.id);
      if (!selection?.isIncluded) {
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

    return rows.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [
    activePlan,
    archiveSemester,
    archiveYear,
    courseDefinitions,
    courseOfferings,
    mode,
    planOfferings,
    activeArchivePlan,
  ]);

  const ruleResult = useProgramRules({
    rule: activeRule,
    selections: activePlan?.selectedOfferings ?? [],
    offerings: planOfferings,
    definitions: courseDefinitions,
  });

  const selectedDetail = useMemo(() => {
    if (!selectedOfferingId) {
      return undefined;
    }

    const item = fullViewOfferings.find((displayOffering) => displayOffering.offering.id === selectedOfferingId);
    if (!item) {
      return undefined;
    }

    const university = item.definition.universityId
      ? universities.find((entry) => entry.id === item.definition.universityId)
      : undefined;
    const professorIds = item.offering.professorIds?.length ? item.offering.professorIds : item.definition.professorIds;
    const names = professorIds
      .map((id) => professors.find((professor) => professor.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    return {
      ...item,
      university,
      professorNames: names,
      lectureSessions: getLectureSessions(item.offering),
    };
  }, [fullViewOfferings, professors, selectedOfferingId, universities]);

  const currentCalendarYear =
    mode === 'archive'
      ? archiveYear
      : activePlan?.academicYear ??
        fullViewOfferings[0]?.offering.academicYear ??
        PLANNING_YEAR;

  const archiveAvailableYears = ARCHIVE_YEAR_CHOICES_DESC;

  const availableYears = archiveAvailableYears;

  useEffect(() => {
    if (mode !== 'archive' || archiveAvailableYears.length === 0 || isAllowedAcademicYear(archiveYear)) {
      return;
    }
    setArchivePeriod(normalizeAcademicYear(archiveYear), archiveSemester);
  }, [archiveAvailableYears, archiveSemester, archiveYear, mode, setArchivePeriod]);

  const handleModeChange = (nextMode: AppMode) => {
    setMode(nextMode);
  };

  const isPlanningLayout = mode === 'planning';

  const handleCalendarYearChange = (nextYear: number) => {
    const normalizedYear = normalizeAcademicYear(nextYear);
    if (mode === 'archive') {
      setArchivePeriod(normalizedYear, archiveSemester);
      return;
    }

    if (normalizedYear !== PLANNING_YEAR) {
      setArchivePeriod(normalizedYear, archiveSemester);
      setMode('archive');
      return;
    }

    const preferredSemester = activePlan?.semesterType ?? 'winter';
    const matchingPlan =
      planningEligiblePlans.find((plan) => plan.semesterType === preferredSemester) ??
      planningEligiblePlans[0];

    if (matchingPlan) {
      setActivePlanId(matchingPlan.id);
      setActivePlanInSettings(matchingPlan.id);
      return;
    }

    setArchivePeriod(normalizedYear, archiveSemester);
    setMode('archive');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setNewPlanOpen(true);
      }

      if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        const svg = document.getElementById('radial-calendar-svg');
        if (svg instanceof SVGSVGElement) {
          void exportSvg(svg, `calendar-${Date.now()}.svg`);
        }
      }

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setMode('archive');
      }

      if (event.key === '?') {
        event.preventDefault();
        setSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setMode]);

  return (
    <div className="min-h-screen bg-[#F8F8FB] pb-20 lg:pb-6">
      <Header
        mode={mode}
        archiveYear={archiveYear}
        archiveSemester={archiveSemester}
        archiveYears={archiveAvailableYears}
        onModeChange={handleModeChange}
        onArchiveChange={setArchivePeriod}
        onExportSvg={() => {
          const svg = document.getElementById('radial-calendar-svg');
          if (svg instanceof SVGSVGElement) {
            void exportSvg(svg, `calendar-${Date.now()}.svg`);
          }
        }}
        onExportPng={() => {
          const svg = document.getElementById('radial-calendar-svg');
          if (svg instanceof SVGSVGElement) {
            void exportPng(svg, `calendar-${Date.now()}.png`);
          }
        }}
        onExportPlan={() => {
          if (activePlan) {
            exportActivePlan(activePlan);
          }
        }}
        onExportFullDb={useAppStore.getState().adminSession ? async () => exportFullDatabase(await exportDatabase()) : undefined}
      />

      <div
        className={clsx(
          'mx-auto w-full gap-4 p-3',
          isPlanningLayout ? 'grid max-w-[1400px] lg:grid-cols-[300px_minmax(0,1fr)]' : 'max-w-[1800px]',
        )}
      >
        {isPlanningLayout ? (
          <aside className="hidden space-y-3 lg:block">
            <button
              type="button"
              className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
              onClick={() => setNewPlanOpen(true)}
            >
              New Plan (N)
            </button>

            <CalendarSwitcher
              plans={planningEligiblePlans}
              activePlanId={activePlan?.id}
              onSelect={(planId) => {
                setActivePlanId(planId);
                setActivePlanInSettings(planId);
              }}
            />

            <PlanningPanel
              rows={planningRows}
              searchQuery={planningSearchQuery}
              activeCategories={planningCategoryFilters}
              ruleResult={ruleResult}
              onSearch={setPlanningSearchQuery}
              onToggleCategory={togglePlanningCategory}
              onToggleInclude={(offeringId, next) => {
                if (!activePlan) {
                  return;
                }
                const row = planningRows.find((item) => item.offering.id === offeringId);
                if (!row || !row.offering.isAvailable) {
                  return;
                }
                void upsertPlanSelection(activePlan.id, offeringId, { isIncluded: next });
              }}
              onDragReorder={(activeId, overId) => {
                if (!activePlan) {
                  return;
                }
                const reordered = reorderByOfferingId(activePlan.selectedOfferings, activeId, overId);
                void reorderPlanSelections(activePlan.id, reordered);
              }}
            />
          </aside>
        ) : null}

        <section className={clsx('space-y-3', !isPlanningLayout ? 'min-h-[calc(100vh-110px)]' : undefined)}>
          <RadialCalendar
            year={currentCalendarYear}
            offerings={fullViewOfferings}
            onSelectOffering={(offeringId) => setSelectedOfferingId(offeringId)}
            availableYears={availableYears}
            onYearChange={handleCalendarYearChange}
            fullCanvas={!isPlanningLayout}
          />

          {mode === 'planning' ? (
            <div className="lg:hidden">
              <BottomSheet open onClose={() => setMode('full')} title="Planning">
                <PlanningPanel
                  rows={planningRows}
                  searchQuery={planningSearchQuery}
                  activeCategories={planningCategoryFilters}
                  ruleResult={ruleResult}
                  onSearch={setPlanningSearchQuery}
                  onToggleCategory={togglePlanningCategory}
                  onToggleInclude={(offeringId, next) => {
                    if (!activePlan) {
                      return;
                    }
                    const row = planningRows.find((item) => item.offering.id === offeringId);
                    if (!row || !row.offering.isAvailable) {
                      return;
                    }
                    void upsertPlanSelection(activePlan.id, offeringId, { isIncluded: next });
                  }}
                  onDragReorder={(activeId, overId) => {
                    if (!activePlan) {
                      return;
                    }
                    const reordered = reorderByOfferingId(activePlan.selectedOfferings, activeId, overId);
                    void reorderPlanSelections(activePlan.id, reordered);
                  }}
                />
              </BottomSheet>
            </div>
          ) : null}
        </section>
      </div>

      <BottomSheet
        open={Boolean(selectedDetail)}
        onClose={() => setSelectedOfferingId(undefined)}
        title={selectedDetail?.definition.name}
      >
        {selectedDetail ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={selectedDetail.definition.category} color={selectedDetail.definition.color} />
              <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-white">
                {selectedDetail.definition.credits} LP
              </span>
              {selectedDetail.definition.isMandatory ? (
                <span className="rounded-full bg-neutral-200 px-2 py-1 text-xs font-semibold">Mandatory</span>
              ) : null}
            </div>

            <div>
              <h4 className="text-sm font-semibold">Professors/Lecturers</h4>
              <p className="text-sm text-text-secondary">
                {selectedDetail.professorNames.join(', ') || 'TBA'}
              </p>
            </div>

            {selectedDetail.university ? (
              <UniversityTag code={selectedDetail.university.shortCode} label={selectedDetail.university.name} />
            ) : null}

            <div>
              <h4 className="text-sm font-semibold">Exam options</h4>
              {selectedDetail.offering.examOptions.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  {selectedDetail.offering.examOptions.map((option) => (
                    <li key={option.id}>
                      {option.type} • {option.date.slice(0, 10)}
                      {option.reexamDate ? ` • reexam ${option.reexamDate.slice(0, 10)}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">No exam configured for this offering.</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold">Lecture schedule</h4>
              {selectedDetail.lectureSessions.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-sm text-text-secondary">
                    {selectedDetail.lectureSessions.length} explicit sessions configured in admin.
                  </p>
                  <ul className="text-xs text-text-secondary">
                    {selectedDetail.lectureSessions
                      .slice(0, 4)
                      .map((session) => (
                        <li key={session.id}>
                          {session.date.slice(0, 10)}
                          {formatTimeRange(session.startTime, session.endTime)
                            ? ` • ${formatTimeRange(session.startTime, session.endTime)}`
                            : ''}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  Weekly pattern inferred from {selectedDetail.offering.startDate.slice(0, 10)} to{' '}
                  {selectedDetail.offering.endDate.slice(0, 10)}.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </BottomSheet>

      <NewPlanModal
        open={newPlanOpen}
        allowedYears={PLANNING_YEAR_CHOICES}
        onClose={() => setNewPlanOpen(false)}
        onCreate={async (name, year, semester) => {
          await createPlan(name, year, semester);
        }}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={appSettings.language}
        onLanguageChange={setLanguage}
      />

      <MobileNavBar
        mode={mode}
        onModeChange={handleModeChange}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
    </div>
  );
}
