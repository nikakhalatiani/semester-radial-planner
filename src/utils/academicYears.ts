import type { SemesterType } from '../types';

export const ALLOWED_ACADEMIC_YEARS = [2025, 2026] as const;
export const PLANNING_YEAR = 2026;

export type AllowedAcademicYear = (typeof ALLOWED_ACADEMIC_YEARS)[number];

export function isAllowedAcademicYear(year: number): year is AllowedAcademicYear {
  return ALLOWED_ACADEMIC_YEARS.includes(year as AllowedAcademicYear);
}

export function normalizeAcademicYear(year: number): AllowedAcademicYear {
  if (isAllowedAcademicYear(year)) {
    return year;
  }

  if (year <= ALLOWED_ACADEMIC_YEARS[0]) {
    return ALLOWED_ACADEMIC_YEARS[0];
  }

  return ALLOWED_ACADEMIC_YEARS[ALLOWED_ACADEMIC_YEARS.length - 1];
}

export const ARCHIVE_YEAR_CHOICES_DESC = [...ALLOWED_ACADEMIC_YEARS].sort((a, b) => b - a);

const ALLOWED_SEMESTERS_BY_YEAR: Record<AllowedAcademicYear, SemesterType[]> = {
  2025: ['winter', 'summer'],
  2026: ['winter', 'summer'],
};

export function getAllowedSemestersForYear(year: number): SemesterType[] {
  const normalizedYear = normalizeAcademicYear(year);
  return ALLOWED_SEMESTERS_BY_YEAR[normalizedYear];
}

export function isSemesterAllowedForYear(year: number, semester: SemesterType): boolean {
  return getAllowedSemestersForYear(year).includes(semester);
}

export function normalizeSemesterForYear(year: number, semester: SemesterType): SemesterType {
  const allowedSemesters = getAllowedSemestersForYear(year);
  return allowedSemesters.includes(semester) ? semester : allowedSemesters[0];
}
