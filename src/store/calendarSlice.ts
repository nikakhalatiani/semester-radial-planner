import type { StateCreator } from 'zustand';

import type { AppMode, SemesterType } from '../types';
import { normalizeAcademicYear, normalizeSemesterForYear } from '../utils/academicYears';
import type { AppStore } from './index';

export interface CalendarSlice {
  mode: AppMode;
  archiveYear: number;
  archiveSemester: SemesterType;
  selectedOfferingId?: string;
  setMode: (mode: AppMode) => void;
  setArchivePeriod: (year: number, semester: SemesterType) => void;
  setSelectedOfferingId: (offeringId?: string) => void;
}

export const createCalendarSlice: StateCreator<AppStore, [], [], CalendarSlice> = (set) => ({
  mode: 'full',
  archiveYear: 2025,
  archiveSemester: 'winter',
  selectedOfferingId: undefined,
  setMode: (mode) => set({ mode }),
  setArchivePeriod: (archiveYear, archiveSemester) => {
    const normalizedYear = normalizeAcademicYear(archiveYear);
    set({
      archiveYear: normalizedYear,
      archiveSemester: normalizeSemesterForYear(normalizedYear, archiveSemester),
    });
  },
  setSelectedOfferingId: (selectedOfferingId) => set({ selectedOfferingId }),
});
