import type { SemesterType } from '../types';

const PROGRAM_BASE_YEAR = 2025;
const PROGRAM_BASE_SEMESTER: SemesterType = 'summer';

function semesterOrder(semesterType: SemesterType): number {
  return semesterType === 'summer' ? 0 : 1;
}

export function deriveProgramSemester(academicYear: number, semesterType: SemesterType): number {
  const baseIndex = PROGRAM_BASE_YEAR * 2 + semesterOrder(PROGRAM_BASE_SEMESTER);
  const currentIndex = academicYear * 2 + semesterOrder(semesterType);
  const derived = currentIndex - baseIndex + 1;
  return Math.max(1, derived);
}

export function resolveProgramSemester(
  explicit: number | undefined,
  academicYear: number,
  semesterType: SemesterType,
): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return Math.max(1, Math.floor(explicit));
  }
  return deriveProgramSemester(academicYear, semesterType);
}

export function formatProgramSemester(value: number): string {
  return `Sem ${value}`;
}

export function formatProgramSemesterForPeriod(
  explicit: number | undefined,
  academicYear: number,
  semesterType: SemesterType,
): string {
  return formatProgramSemester(resolveProgramSemester(explicit, academicYear, semesterType));
}

export function formatProgramSemesterWithYear(
  explicit: number | undefined,
  academicYear: number,
  semesterType: SemesterType,
): string {
  return `${formatProgramSemesterForPeriod(explicit, academicYear, semesterType)} ${academicYear}`;
}
