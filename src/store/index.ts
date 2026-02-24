import { create } from 'zustand';

import type {
  AdminChangelogEntry,
  CourseDefinition,
  CourseOffering,
  MastersProgramRule,
  Professor,
  SeedData,
  SemesterType,
  AdminSession,
  University,
  UserPlan,
} from '../types';
import { IndexedDBAdapter } from '../storage/indexedDBAdapter';

import { createAdminSlice, type AdminSlice } from './adminSlice';
import { createCalendarSlice, type CalendarSlice } from './calendarSlice';
import { createPlanningSlice, type PlanningSlice } from './planningSlice';
import {
  APP_SETTINGS_KEY,
  createSettingsSlice,
  defaultSettings,
  type SettingsSlice,
} from './settingsSlice';
import { normalizeAcademicYear, normalizeSemesterForYear } from '../utils/academicYears';

const ADMIN_SESSION_KEY = 'srp_admin_session';
const storageAdapter = new IndexedDBAdapter();

interface DataState {
  isLoading: boolean;
  isReady: boolean;
  error?: string;
  universities: University[];
  professors: Professor[];
  courseDefinitions: CourseDefinition[];
  courseOfferings: CourseOffering[];
  userPlans: UserPlan[];
  programRules: MastersProgramRule[];
  adminChangelog: AdminChangelogEntry[];
}

interface DataActions {
  initializeApp: () => Promise<void>;
  reloadData: () => Promise<void>;

  saveUniversity: (university: University, changedBy: string) => Promise<void>;
  deleteUniversity: (id: string, changedBy: string) => Promise<void>;

  saveProfessor: (professor: Professor, changedBy: string) => Promise<void>;
  deleteProfessor: (id: string, changedBy: string) => Promise<void>;

  saveCourseDefinition: (definition: CourseDefinition, changedBy: string) => Promise<void>;
  deleteCourseDefinition: (id: string, changedBy: string) => Promise<void>;

  saveOffering: (offering: CourseOffering, changedBy: string) => Promise<void>;
  deleteOffering: (id: string, changedBy: string) => Promise<void>;

  savePlan: (plan: UserPlan, changedBy: string) => Promise<void>;
  deletePlan: (id: string, changedBy: string) => Promise<void>;
  upsertPlanSelection: (
    planId: string,
    offeringId: string,
    updates: Partial<UserPlan['selectedOfferings'][number]>,
  ) => Promise<void>;
  upsertPlanSelectionsBulk: (
    planId: string,
    entries: Array<{
      offeringId: string;
      updates: Partial<UserPlan['selectedOfferings'][number]>;
    }>,
  ) => Promise<void>;
  reorderPlanSelections: (planId: string, reorderedSelections: UserPlan['selectedOfferings']) => Promise<void>;
  createPlan: (name: string, year: number, semester: SemesterType) => Promise<void>;

  saveProgramRule: (rule: MastersProgramRule, changedBy: string) => Promise<void>;
  deleteProgramRule: (id: string, changedBy: string) => Promise<void>;

  exportDatabase: () => Promise<SeedData>;
  importDatabase: (payload: SeedData, changedBy: string) => Promise<void>;
}

export type AppStore = DataState & DataActions & CalendarSlice & PlanningSlice & SettingsSlice & AdminSlice;

function parseStoredSettings() {
  const raw = localStorage.getItem(APP_SETTINGS_KEY);
  if (!raw) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<typeof defaultSettings>;
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch {
    return defaultSettings;
  }
}

function parseAdminSession(): AdminSession | null {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { email?: string; role?: 'superadmin' | 'editor'; token?: string };
    if (parsed.email && parsed.role && parsed.token) {
      return { email: parsed.email, role: parsed.role, token: parsed.token };
    }
  } catch {
    return null;
  }

  return null;
}

function sortPlans(plans: UserPlan[]) {
  return [...plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function nextIncludedDisplayOrder(
  selections: UserPlan['selectedOfferings'],
  ignoreOfferingId?: string,
): number {
  const includedOrders = selections
    .filter((selection) => selection.isIncluded && selection.offeringId !== ignoreOfferingId)
    .map((selection) => selection.displayOrder);
  if (includedOrders.length === 0) {
    return 0;
  }
  return Math.max(...includedOrders) + 1;
}

function makeAdminLog(
  entityType: AdminChangelogEntry['entityType'],
  entityId: string,
  action: AdminChangelogEntry['action'],
  changedBy: string,
  diffSummary: string,
): AdminChangelogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entityType,
    entityId,
    action,
    changedAt: new Date().toISOString(),
    changedBy,
    diffSummary,
  };
}

export const useAppStore = create<AppStore>((set, get, store) => ({
  ...createCalendarSlice(set, get, store),
  ...createPlanningSlice(set, get, store),
  ...createSettingsSlice(set, get, store),
  ...createAdminSlice(set, get, store),

  isLoading: false,
  isReady: false,
  error: undefined,
  universities: [],
  professors: [],
  courseDefinitions: [],
  courseOfferings: [],
  userPlans: [],
  programRules: [],
  adminChangelog: [],

  initializeApp: async () => {
    set({ isLoading: true, error: undefined });

    try {
      await storageAdapter.initialize();
      const settings = parseStoredSettings();
      const adminSession = parseAdminSession();

      const [
        universities,
        professors,
        courseDefinitions,
        courseOfferings,
        userPlans,
        programRules,
        adminChangelog,
      ] = await Promise.all([
        storageAdapter.getUniversities(),
        storageAdapter.getProfessors(),
        storageAdapter.getCourseDefinitions(),
        storageAdapter.getAllOfferings(),
        storageAdapter.getPlans(),
        storageAdapter.getProgramRules(),
        storageAdapter.getAdminChangelog(),
      ]);

      const sortedPlans = sortPlans(userPlans);
      const activeRule = settings.activeProgramRuleId || programRules.find((rule) => rule.isActive)?.id;
      const activePlanId = settings.activePlanId ?? sortedPlans[0]?.id;

      set({
        universities,
        professors,
        courseDefinitions,
        courseOfferings,
        userPlans: sortedPlans,
        programRules,
        adminChangelog,
        appSettings: {
          ...settings,
          activeProgramRuleId: activeRule ?? settings.activeProgramRuleId,
          activePlanId,
        },
        activePlanId,
        mode: settings.defaultView,
        adminSession,
        isReady: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        isReady: false,
        error: error instanceof Error ? error.message : 'Failed to initialize application',
      });
    }
  },

  reloadData: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const [
        universities,
        professors,
        courseDefinitions,
        courseOfferings,
        userPlans,
        programRules,
        adminChangelog,
      ] = await Promise.all([
        storageAdapter.getUniversities(),
        storageAdapter.getProfessors(),
        storageAdapter.getCourseDefinitions(),
        storageAdapter.getAllOfferings(),
        storageAdapter.getPlans(),
        storageAdapter.getProgramRules(),
        storageAdapter.getAdminChangelog(),
      ]);

      set({
        universities,
        professors,
        courseDefinitions,
        courseOfferings,
        userPlans: sortPlans(userPlans),
        programRules,
        adminChangelog,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reload data',
      });
    }
  },

  saveUniversity: async (university, changedBy) => {
    await storageAdapter.saveUniversity(university);
    const log = makeAdminLog('universities', university.id, 'update', changedBy, `Saved university ${university.name}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  deleteUniversity: async (id, changedBy) => {
    await storageAdapter.deleteUniversity(id);
    const log = makeAdminLog('universities', id, 'delete', changedBy, `Deleted university ${id}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  saveProfessor: async (professor, changedBy) => {
    await storageAdapter.saveProfessor(professor);
    const log = makeAdminLog('professors', professor.id, 'update', changedBy, `Saved professor ${professor.name}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  deleteProfessor: async (id, changedBy) => {
    await storageAdapter.deleteProfessor(id);
    const log = makeAdminLog('professors', id, 'delete', changedBy, `Deleted professor ${id}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  saveCourseDefinition: async (definition, changedBy) => {
    await storageAdapter.saveCourseDefinition(definition);
    const log = makeAdminLog(
      'courseDefinitions',
      definition.id,
      'update',
      changedBy,
      `Saved course definition ${definition.name}`,
    );
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  deleteCourseDefinition: async (id, changedBy) => {
    await storageAdapter.deleteCourseDefinition(id);
    const log = makeAdminLog('courseDefinitions', id, 'delete', changedBy, `Deleted course definition ${id}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  saveOffering: async (offering, changedBy) => {
    const normalizedYear = normalizeAcademicYear(offering.academicYear);
    const normalizedOffering = {
      ...offering,
      academicYear: normalizedYear,
      semesterType: normalizeSemesterForYear(normalizedYear, offering.semesterType),
    };
    await storageAdapter.saveOffering(normalizedOffering);
    const log = makeAdminLog(
      'courseOfferings',
      normalizedOffering.id,
      'update',
      changedBy,
      `Saved offering ${normalizedOffering.id} (${normalizedOffering.academicYear} ${normalizedOffering.semesterType})`,
    );
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  deleteOffering: async (id, changedBy) => {
    await storageAdapter.deleteOffering(id);
    const log = makeAdminLog('courseOfferings', id, 'delete', changedBy, `Deleted offering ${id}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  savePlan: async (plan, changedBy) => {
    const normalizedYear = normalizeAcademicYear(plan.academicYear);
    const normalizedPlan = {
      ...plan,
      academicYear: normalizedYear,
      semesterType: normalizeSemesterForYear(normalizedYear, plan.semesterType),
    };
    await storageAdapter.savePlan(normalizedPlan);
    const log = makeAdminLog('userPlans', normalizedPlan.id, 'update', changedBy, `Saved plan ${normalizedPlan.name}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  deletePlan: async (id, changedBy) => {
    await storageAdapter.deletePlan(id);
    const log = makeAdminLog('userPlans', id, 'delete', changedBy, `Deleted plan ${id}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  upsertPlanSelection: async (planId, offeringId, updates) => {
    const plan = get().userPlans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    const existing = plan.selectedOfferings.find((item) => item.offeringId === offeringId);
    const nextSelection = existing
      ? {
          ...existing,
          ...updates,
        }
      : {
          offeringId,
          selectedExamOptionId: updates.selectedExamOptionId ?? '',
          isIncluded: updates.isIncluded ?? false,
          displayOrder: updates.displayOrder ?? nextIncludedDisplayOrder(plan.selectedOfferings),
        };

    if (
      updates.isIncluded === true &&
      updates.displayOrder === undefined &&
      !(existing?.isIncluded ?? false)
    ) {
      nextSelection.displayOrder = nextIncludedDisplayOrder(plan.selectedOfferings, offeringId);
    }

    const selectedOfferings = [
      ...plan.selectedOfferings.filter((item) => item.offeringId !== offeringId),
      nextSelection,
    ];

    const nextPlan: UserPlan = {
      ...plan,
      selectedOfferings,
      updatedAt: new Date().toISOString(),
    };

    await storageAdapter.savePlan(nextPlan);
    set((state) => ({
      userPlans: sortPlans(state.userPlans.map((item) => (item.id === nextPlan.id ? nextPlan : item))),
    }));
  },

  upsertPlanSelectionsBulk: async (planId, entries) => {
    if (entries.length === 0) {
      return;
    }

    const plan = get().userPlans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    const selectionByOfferingId = new Map(
      plan.selectedOfferings.map((selection) => [selection.offeringId, selection]),
    );

    entries.forEach(({ offeringId, updates }) => {
      const existing = selectionByOfferingId.get(offeringId);
      const nextSelection = existing
        ? {
            ...existing,
            ...updates,
          }
        : {
            offeringId,
            selectedExamOptionId: updates.selectedExamOptionId ?? '',
            isIncluded: updates.isIncluded ?? false,
            displayOrder:
              updates.displayOrder ?? nextIncludedDisplayOrder(Array.from(selectionByOfferingId.values())),
          };

      if (
        updates.isIncluded === true &&
        updates.displayOrder === undefined &&
        !(existing?.isIncluded ?? false)
      ) {
        nextSelection.displayOrder = nextIncludedDisplayOrder(
          Array.from(selectionByOfferingId.values()),
          offeringId,
        );
      }

      selectionByOfferingId.set(offeringId, nextSelection);
    });

    const nextPlan: UserPlan = {
      ...plan,
      selectedOfferings: Array.from(selectionByOfferingId.values()),
      updatedAt: new Date().toISOString(),
    };

    await storageAdapter.savePlan(nextPlan);
    set((state) => ({
      userPlans: sortPlans(state.userPlans.map((item) => (item.id === nextPlan.id ? nextPlan : item))),
    }));
  },

  reorderPlanSelections: async (planId, reorderedSelections) => {
    const plan = get().userPlans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    const nextPlan: UserPlan = {
      ...plan,
      selectedOfferings: reorderedSelections,
      updatedAt: new Date().toISOString(),
    };

    await storageAdapter.savePlan(nextPlan);
    set((state) => ({
      userPlans: sortPlans(state.userPlans.map((item) => (item.id === nextPlan.id ? nextPlan : item))),
    }));
  },

  createPlan: async (name, year, semester) => {
    const normalizedYear = normalizeAcademicYear(year);
    const normalizedSemester = normalizeSemesterForYear(normalizedYear, semester);
    const ruleId =
      get().appSettings.activeProgramRuleId || get().programRules.find((rule) => rule.isActive)?.id || '';
    const offerings = get()
      .courseOfferings
      .filter(
        (offering) =>
          offering.academicYear === normalizedYear &&
          offering.semesterType === normalizedSemester,
      )
      .sort((a, b) => {
        const dateDiff = a.startDate.localeCompare(b.startDate);
        if (dateDiff !== 0) {
          return dateDiff;
        }
        return a.id.localeCompare(b.id);
      });

    const selectedOfferings = offerings.map((offering, index) => ({
      offeringId: offering.id,
      selectedExamOptionId:
        offering.examOptions.find((option) => option.isDefault)?.id ?? offering.examOptions[0]?.id ?? '',
      isIncluded: false,
      displayOrder: index,
    }));

    const now = new Date().toISOString();
    const plan: UserPlan = {
      id: `plan-${Date.now()}`,
      name,
      academicYear: normalizedYear,
      semesterType: normalizedSemester,
      programRuleId: ruleId,
      selectedOfferings,
      createdAt: now,
      updatedAt: now,
    };

    await storageAdapter.savePlan(plan);

    const nextSettings = {
      ...get().appSettings,
      activePlanId: plan.id,
    };
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(nextSettings));

    set((state) => ({
      userPlans: sortPlans([...state.userPlans, plan]),
      activePlanId: plan.id,
      appSettings: nextSettings,
    }));
  },

  saveProgramRule: async (rule, changedBy) => {
    await storageAdapter.saveProgramRule(rule);
    const log = makeAdminLog('programRules', rule.id, 'update', changedBy, `Saved program rule ${rule.programName}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  deleteProgramRule: async (id, changedBy) => {
    await storageAdapter.deleteProgramRule(id);
    const log = makeAdminLog('programRules', id, 'delete', changedBy, `Deleted program rule ${id}`);
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },

  exportDatabase: async () => storageAdapter.exportDatabase(),

  importDatabase: async (payload, changedBy) => {
    await storageAdapter.importDatabase(payload);
    const log = makeAdminLog('programRules', 'import', 'import', changedBy, 'Imported database snapshot');
    await storageAdapter.saveAdminChangelogEntry(log);
    await get().reloadData();
  },
}));

useAppStore.subscribe((state) => {
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(state.appSettings));
});
