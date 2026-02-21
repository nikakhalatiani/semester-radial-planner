import type { StateCreator } from 'zustand';

import type { CourseCategory } from '../types';
import type { AppStore } from './index';

const ALL_CATEGORIES: CourseCategory[] = ['FM', 'SE', 'HCI', 'DB', 'DS', 'SS'];

export interface PlanningSlice {
  activePlanId?: string;
  planningSearchQuery: string;
  planningCategoryFilters: CourseCategory[];
  setActivePlanId: (planId?: string) => void;
  setPlanningSearchQuery: (query: string) => void;
  togglePlanningCategory: (category: CourseCategory) => void;
  clearPlanningFilters: () => void;
}

export const createPlanningSlice: StateCreator<AppStore, [], [], PlanningSlice> = (set) => ({
  activePlanId: undefined,
  planningSearchQuery: '',
  planningCategoryFilters: ALL_CATEGORIES,
  setActivePlanId: (activePlanId) => set({ activePlanId }),
  setPlanningSearchQuery: (planningSearchQuery) => set({ planningSearchQuery }),
  togglePlanningCategory: (category) =>
    set((state) => {
      const exists = state.planningCategoryFilters.includes(category);
      return {
        planningCategoryFilters: exists
          ? state.planningCategoryFilters.filter((item) => item !== category)
          : [...state.planningCategoryFilters, category],
      };
    }),
  clearPlanningFilters: () => set({ planningCategoryFilters: ALL_CATEGORIES }),
});
