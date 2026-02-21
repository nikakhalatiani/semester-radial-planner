import { useEffect, useMemo, useState } from 'react';

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
import { exportActivePlan, exportFullDatabase, exportPng, exportSvg } from '../utils/export';

function inferSemester(date: Date): SemesterType {
  const month = date.getMonth() + 1;
  return month >= 4 && month <= 9 ? 'summer' : 'winter';
}

function getPlanById(plans: UserPlan[], planId?: string) {
  return plans.find((plan) => plan.id === planId) ?? plans[0];
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
    reorderPlanSelections,
    exportDatabase,
  } = useAppStore((state) => state);

  const reorderByOfferingId = useDragOrder();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);

  const activePlan = getPlanById(userPlans, activePlanId);
  const activeRule = programRules.find((rule) => rule.id === (activePlan?.programRuleId ?? appSettings.activeProgramRuleId));

  useEffect(() => {
    if (userPlans.length > 0 || courseOfferings.length === 0) {
      return;
    }

    const now = new Date();
    void createPlan('Current Plan', now.getFullYear(), inferSemester(now));
  }, [courseOfferings.length, createPlan, userPlans.length]);

  const planOfferings = useMemo(() => {
    if (!activePlan) {
      return [];
    }
    return courseOfferings.filter(
      (offering) =>
        offering.academicYear === activePlan.academicYear && offering.semesterType === activePlan.semesterType,
    );
  }, [activePlan, courseOfferings]);

  useEffect(() => {
    if (!activePlan) {
      return;
    }

    const selectionMap = new Map(activePlan.selectedOfferings.map((selection) => [selection.offeringId, selection]));
    const definitionMap = new Map(courseDefinitions.map((definition) => [definition.id, definition]));

    planOfferings.forEach((offering, index) => {
      if (selectionMap.has(offering.id)) {
        return;
      }

      const definition = definitionMap.get(offering.courseDefinitionId);
      const defaultExamOptionId =
        offering.examOptions.find((option) => option.isDefault)?.id ?? offering.examOptions[0]?.id ?? '';

      void upsertPlanSelection(activePlan.id, offering.id, {
        selectedExamOptionId: defaultExamOptionId,
        isIncluded: definition?.isMandatory ?? false,
        displayOrder: index,
      });
    });
  }, [activePlan, courseDefinitions, planOfferings, upsertPlanSelection]);

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

      if (!planningCategoryFilters.includes(definition.category)) {
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
        university: universityById.get(definition.universityId),
        professorNames,
      });
    });

    return rows.sort((a, b) => {
      const orderA = a.selection?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.selection?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
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
      const archiveRows: RadialDisplayOffering[] = [];
      courseOfferings
        .filter((offering) => offering.academicYear === archiveYear && offering.semesterType === archiveSemester)
        .forEach((offering, index) => {
          const definition = definitionById.get(offering.courseDefinitionId);
          if (!definition) {
            return;
          }

          archiveRows.push({
            offering,
            definition,
            selectedExamOption: offering.examOptions.find((option) => option.isDefault) ?? offering.examOptions[0],
            displayOrder: index,
          });
        });

      return archiveRows;
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
        selectedExamOption: offering.examOptions.find((option) => option.id === selection.selectedExamOptionId),
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

    const university = universities.find((entry) => entry.id === item.definition.universityId);
    const professorIds = item.offering.professorIds?.length ? item.offering.professorIds : item.definition.professorIds;
    const names = professorIds
      .map((id) => professors.find((professor) => professor.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    return {
      ...item,
      university,
      professorNames: names,
    };
  }, [fullViewOfferings, professors, selectedOfferingId, universities]);

  const currentCalendarYear =
    mode === 'archive'
      ? archiveYear
      : activePlan?.academicYear ??
        fullViewOfferings[0]?.offering.academicYear ??
        new Date().getFullYear();

  const handleModeChange = (nextMode: AppMode) => {
    setMode(nextMode);
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

      <div className="mx-auto grid w-full max-w-[1400px] gap-4 p-3 lg:grid-cols-[300px_1fr]">
        <aside className="hidden space-y-3 lg:block">
          <button
            type="button"
            className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
            onClick={() => setNewPlanOpen(true)}
          >
            New Plan (N)
          </button>

          <CalendarSwitcher
            plans={userPlans}
            activePlanId={activePlan?.id}
            onSelect={(planId) => {
              setActivePlanId(planId);
              setActivePlanInSettings(planId);
            }}
          />

          {mode === 'planning' ? (
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
                if (!row || row.definition.isMandatory || !row.offering.isAvailable) {
                  return;
                }
                void upsertPlanSelection(activePlan.id, offeringId, { isIncluded: next });
              }}
              onSelectExam={(offeringId, examOptionId) => {
                if (!activePlan) {
                  return;
                }
                void upsertPlanSelection(activePlan.id, offeringId, {
                  selectedExamOptionId: examOptionId,
                });
              }}
              onDragReorder={(activeId, overId) => {
                if (!activePlan) {
                  return;
                }
                const reordered = reorderByOfferingId(activePlan.selectedOfferings, activeId, overId);
                void reorderPlanSelections(activePlan.id, reordered);
              }}
            />
          ) : null}
        </aside>

        <section className="space-y-3">
          <RadialCalendar
            year={currentCalendarYear}
            offerings={fullViewOfferings}
            onSelectOffering={(offeringId) => setSelectedOfferingId(offeringId)}
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
                    if (!row || row.definition.isMandatory || !row.offering.isAvailable) {
                      return;
                    }
                    void upsertPlanSelection(activePlan.id, offeringId, { isIncluded: next });
                  }}
                  onSelectExam={(offeringId, examOptionId) => {
                    if (!activePlan) {
                      return;
                    }
                    void upsertPlanSelection(activePlan.id, offeringId, {
                      selectedExamOptionId: examOptionId,
                    });
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
              <h4 className="text-sm font-semibold">Professors</h4>
              <p className="text-sm text-text-secondary">
                {selectedDetail.professorNames.join(', ') || 'TBA'}
              </p>
            </div>

            {selectedDetail.university ? (
              <UniversityTag code={selectedDetail.university.shortCode} label={selectedDetail.university.name} />
            ) : null}

            <div>
              <h4 className="text-sm font-semibold">Exam options</h4>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                {selectedDetail.offering.examOptions.map((option) => (
                  <li key={option.id}>
                    {option.type} • {option.date.slice(0, 10)}
                    {option.reexamDate ? ` • reexam ${option.reexamDate.slice(0, 10)}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </BottomSheet>

      <NewPlanModal
        open={newPlanOpen}
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
