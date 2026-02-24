import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { RadialCalendar } from '../components/calendar/RadialCalendar';
import { Header } from '../components/layout/Header';
import { MobileNavBar } from '../components/layout/MobileNavBar';
import { ManagePlansModal } from '../components/modals/ManagePlansModal';
import { NewPlanModal } from '../components/modals/NewPlanModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import {
  PlanningPanel,
  type PlanningRow,
  type RuleScopePlanOption,
} from '../components/planning/PlanningPanel';
import { PlanningRulesCollapsedPreview, PlanningRulesPanel } from '../components/planning/PlanningRulesPanel';
import { RulesOverlayPanel } from '../components/planning/RulesOverlayPanel';
import { BottomSheet } from '../components/ui/BottomSheet';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { UniversityTag } from '../components/ui/UniversityTag';
import { useI18n } from '../hooks/useI18n';
import { useProgramRules } from '../hooks/useProgramRules';
import { useAppStore } from '../store';
import type { AppMode, RadialDisplayOffering, SemesterType, UserPlan } from '../types';
import {
  ARCHIVE_YEAR_CHOICES_DESC,
  PLANNING_YEAR,
  isAllowedAcademicYear,
  normalizeAcademicYear,
} from '../utils/academicYears';
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
  const { t, language } = useI18n();
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
    deletePlan,
    upsertPlanSelection,
    upsertPlanSelectionsBulk,
  } = useAppStore((state) => state);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [managePlansOpen, setManagePlansOpen] = useState(false);
  const [selectedArchivePlanIds, setSelectedArchivePlanIds] = useState<string[]>([]);

  const planningEligiblePlans = useMemo(
    () =>
      userPlans.filter(
        (plan) => plan.academicYear === PLANNING_YEAR && !isArchivePlanName(plan.name),
      ),
    [userPlans],
  );
  const activePlan = getPlanById(planningEligiblePlans, activePlanId);
  const activeRule = programRules.find((rule) => rule.id === (activePlan?.programRuleId ?? appSettings.activeProgramRuleId));
  const activePlanScopeId = activePlan?.id;
  const [ruleScopePlanIds, setRuleScopePlanIds] = useState<string[]>([]);
  const validRuleScopePlanIds = useMemo(
    () => new Set(planningEligiblePlans.map((plan) => plan.id)),
    [planningEligiblePlans],
  );

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

  const effectiveRuleScopePlanIds = useMemo(() => {
    const filtered = ruleScopePlanIds.filter((planId) => validRuleScopePlanIds.has(planId));
    if (activePlanScopeId) {
      if (filtered.length === 0) {
        return [activePlanScopeId];
      }
      return filtered.includes(activePlanScopeId) ? filtered : [activePlanScopeId, ...filtered];
    }
    return filtered;
  }, [activePlanScopeId, ruleScopePlanIds, validRuleScopePlanIds]);

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
      .filter(
        (offering) =>
          offering.academicYear === activePlan.academicYear &&
          offering.semesterType === activePlan.semesterType,
      )
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

  const ruleScopePlanOptions = useMemo<RuleScopePlanOption[]>(
    () =>
      planningEligiblePlans.map((plan) => ({
        id: plan.id,
        label: `${plan.name} (${plan.semesterType === 'winter' ? 'WS' : 'SS'} ${plan.academicYear})`,
      })),
    [planningEligiblePlans],
  );

  const ruleScopeSelection = useMemo(
    () => new Set(effectiveRuleScopePlanIds),
    [effectiveRuleScopePlanIds],
  );

  const aggregatedRuleInputs = useMemo(() => {
    const selectedPlans = planningEligiblePlans.filter((plan) => ruleScopeSelection.has(plan.id));
    const offeringById = new Map<string, (typeof courseOfferings)[number]>();
    const selections: (typeof selectedPlans)[number]['selectedOfferings'][number][] = [];

    selectedPlans.forEach((plan) => {
      const scopedOfferings = courseOfferings.filter(
        (offering) =>
          offering.academicYear === plan.academicYear && offering.semesterType === plan.semesterType,
      );
      const scopedOfferingIdSet = new Set(scopedOfferings.map((offering) => offering.id));
      scopedOfferings.forEach((offering) => offeringById.set(offering.id, offering));
      plan.selectedOfferings.forEach((selection) => {
        if (scopedOfferingIdSet.has(selection.offeringId)) {
          selections.push(selection);
        }
      });
    });

    return {
      offerings: Array.from(offeringById.values()),
      selections,
    };
  }, [courseOfferings, planningEligiblePlans, ruleScopeSelection]);

  const archivePlansForYear = useMemo(
    () =>
      userPlans
        .filter(
          (plan) =>
            plan.academicYear === archiveYear &&
            isArchivePlanName(plan.name),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [archiveYear, userPlans],
  );

  const effectiveSelectedArchivePlanIds = useMemo(() => {
    const validIdSet = new Set(archivePlansForYear.map((plan) => plan.id));
    const filtered = selectedArchivePlanIds.filter((planId) => validIdSet.has(planId));
    if (filtered.length > 0) {
      return filtered;
    }
    return archivePlansForYear.map((plan) => plan.id);
  }, [archivePlansForYear, selectedArchivePlanIds]);

  const selectedArchivePlans = useMemo(
    () => archivePlansForYear.filter((plan) => effectiveSelectedArchivePlanIds.includes(plan.id)),
    [archivePlansForYear, effectiveSelectedArchivePlanIds],
  );

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
        (offering) => offering.academicYear === archiveYear,
      );
      const archiveOfferingById = new Map(archiveOfferings.map((offering) => [offering.id, offering]));

      if (selectedArchivePlans.length > 0) {
        const rowsFromPlan: RadialDisplayOffering[] = [];
        const seenOfferingIds = new Set<string>();

        selectedArchivePlans.forEach((plan, planIndex) => {
          plan.selectedOfferings
            .filter((selection) => selection.isIncluded)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .forEach((selection) => {
              const offering = archiveOfferingById.get(selection.offeringId);
              if (!offering || seenOfferingIds.has(offering.id)) {
                return;
              }
              const definition = definitionById.get(offering.courseDefinitionId);
              if (!definition) {
                return;
              }

              seenOfferingIds.add(offering.id);
              rowsFromPlan.push({
                offering,
                definition,
                selectedExamOption:
                  offering.examOptions.find((option) => option.id === selection.selectedExamOptionId) ??
                  offering.examOptions.find((option) => option.isDefault) ??
                  offering.examOptions[0],
                displayOrder: planIndex * 1000 + selection.displayOrder,
              });
            });
        });

        return rowsFromPlan.sort((a, b) => a.displayOrder - b.displayOrder);
      }

      const rowsFromOfferings: RadialDisplayOffering[] = [];
      archiveOfferings
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
        })
        .forEach((offering, index) => {
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
    archiveYear,
    courseDefinitions,
    courseOfferings,
    mode,
    planOfferings,
    selectedArchivePlans,
  ]);

  const ruleResult = useProgramRules({
    rule: activeRule,
    selections: aggregatedRuleInputs.selections,
    offerings: aggregatedRuleInputs.offerings,
    definitions: courseDefinitions,
    language,
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
  const archivePlanOptions = archivePlansForYear.map((plan) => ({
    value: plan.id,
    label: `${plan.name} (${plan.semesterType === 'winter' ? 'WS' : 'SS'} ${plan.academicYear})`,
  }));

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

  const handleToggleRuleScopePlan = (planId: string) => {
    setRuleScopePlanIds((current) => {
      const filtered = current.filter((id) => validRuleScopePlanIds.has(id));
      const normalized = activePlanScopeId
        ? filtered.length === 0
          ? [activePlanScopeId]
          : filtered.includes(activePlanScopeId)
            ? filtered
            : [activePlanScopeId, ...filtered]
        : filtered;

      if (normalized.includes(planId)) {
        if (normalized.length === 1) {
          return normalized;
        }
        return normalized.filter((id) => id !== planId);
      }
      return [...normalized, planId];
    });
  };

  const handleToggleArchivePlan = (planId: string) => {
    setSelectedArchivePlanIds((current) => {
      const validIdSet = new Set(archivePlansForYear.map((plan) => plan.id));
      const filtered = current.filter((id) => validIdSet.has(id));
      const normalized = filtered.length > 0 ? filtered : archivePlansForYear.map((plan) => plan.id);

      if (normalized.includes(planId)) {
        if (normalized.length === 1) {
          return normalized;
        }
        return normalized.filter((id) => id !== planId);
      }

      return [...normalized, planId];
    });
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
    <div className="min-h-screen bg-white pb-20 lg:pb-6">
      <Header
        mode={mode}
        archivePlanOptions={archivePlanOptions}
        selectedArchivePlanIds={effectiveSelectedArchivePlanIds}
        onModeChange={handleModeChange}
        onToggleArchivePlan={handleToggleArchivePlan}
        onManagePlans={() => setManagePlansOpen(true)}
        onNewPlan={() => setNewPlanOpen(true)}
      />

      <div
        className={clsx(
          'mx-auto w-full gap-4 bg-white px-3 pb-3 pt-3',
          isPlanningLayout ? 'grid max-w-[1500px] lg:grid-cols-[340px_minmax(0,1fr)]' : 'max-w-[1800px]',
        )}
      >
        {isPlanningLayout ? (
          <aside className="hidden lg:block">
            <PlanningPanel
              rows={planningRows}
              searchQuery={planningSearchQuery}
              activeCategories={planningCategoryFilters}
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
              className="flex h-[calc(100vh-132px)] flex-col"
              cardsClassName="min-h-0 flex-1 pr-1"
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
            <RulesOverlayPanel
              fullOverlay
              collapsedContent={({ toggle }) => (
                <PlanningRulesCollapsedPreview
                  ruleResult={ruleResult}
                  ruleScopePlanOptions={ruleScopePlanOptions}
                  selectedRuleScopePlanIds={effectiveRuleScopePlanIds}
                  onToggleRuleScopePlan={handleToggleRuleScopePlan}
                  onExpand={toggle}
                />
              )}
            >
              <PlanningRulesPanel
                ruleResult={ruleResult}
                ruleScopePlanOptions={ruleScopePlanOptions}
                selectedRuleScopePlanIds={effectiveRuleScopePlanIds}
                onToggleRuleScopePlan={handleToggleRuleScopePlan}
                checkerExpandable={false}
                className="border-0 bg-transparent p-0"
              />
            </RulesOverlayPanel>
          ) : null}

          {mode === 'planning' ? (
            <div className="lg:hidden">
              <BottomSheet open onClose={() => setMode('full')} title={t('mode.planning', 'Planning')}>
                <PlanningPanel
                  rows={planningRows}
                  searchQuery={planningSearchQuery}
                  activeCategories={planningCategoryFilters}
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
                <span className="rounded-full bg-neutral-200 px-2 py-1 text-xs font-semibold">
                  {t('plan.mandatory', 'Mandatory')}
                </span>
              ) : null}
            </div>

            <div>
              <h4 className="text-sm font-semibold">{t('detail.professors', 'Professors/Lecturers')}</h4>
              <p className="text-sm text-text-secondary">
                {selectedDetail.professorNames.join(', ') || t('common.tba', 'TBA')}
              </p>
            </div>

            {selectedDetail.university ? (
              <UniversityTag code={selectedDetail.university.shortCode} label={selectedDetail.university.name} />
            ) : null}

            <div>
              <h4 className="text-sm font-semibold">{t('detail.examOptions', 'Exam options')}</h4>
              {selectedDetail.offering.examOptions.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  {selectedDetail.offering.examOptions.map((option) => (
                    <li key={option.id}>
                      {option.type === 'oral'
                        ? t('calendar.event.oral', 'Oral')
                        : option.type === 'project'
                          ? t('calendar.event.project', 'Project')
                          : t('calendar.event.written', 'Written')}{' '}
                      • {option.date.slice(0, 10)}
                      {option.reexamDate ? ` • ${t('calendar.reexamShort', 'reexam')} ${option.reexamDate.slice(0, 10)}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">
                  {t('detail.noExamConfigured', 'No exam configured for this offering.')}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold">{t('detail.lectureSchedule', 'Lecture schedule')}</h4>
              {selectedDetail.lectureSessions.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-sm text-text-secondary">
                    {t('detail.explicitSessions', '{count} explicit sessions configured in admin.', {
                      count: selectedDetail.lectureSessions.length,
                    })}
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
                  {t('detail.weeklyPatternInferred', 'Weekly pattern inferred from {start} to {end}.', {
                    start: selectedDetail.offering.startDate.slice(0, 10),
                    end: selectedDetail.offering.endDate.slice(0, 10),
                  })}
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

      <ManagePlansModal
        open={managePlansOpen}
        plans={planningEligiblePlans}
        activePlanId={activePlan?.id}
        onClose={() => setManagePlansOpen(false)}
        onSelect={(planId) => {
          setActivePlanId(planId);
          setActivePlanInSettings(planId);
        }}
        onDelete={async (planId) => {
          await deletePlan(planId, 'user');
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
