import type { SeedData } from '../types';

function sortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

export function createCompactSeedSnapshot(seed: SeedData): SeedData {
  return {
    ...seed,
    universities: sortById(seed.universities),
    professors: sortById(seed.professors),
    courseDefinitions: sortById(seed.courseDefinitions),
    courseOfferings: [...seed.courseOfferings].sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return a.academicYear - b.academicYear;
      }
      if (a.semesterType !== b.semesterType) {
        return a.semesterType.localeCompare(b.semesterType);
      }
      const dateDiff = a.startDate.localeCompare(b.startDate);
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return a.id.localeCompare(b.id);
    }),
    userPlans: [...seed.userPlans].sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return a.academicYear - b.academicYear;
      }
      if (a.semesterType !== b.semesterType) {
        return a.semesterType.localeCompare(b.semesterType);
      }
      const updatedDiff = b.updatedAt.localeCompare(a.updatedAt);
      if (updatedDiff !== 0) {
        return updatedDiff;
      }
      return a.id.localeCompare(b.id);
    }),
    programRules: sortById(seed.programRules),
    // Keep seed snapshots small and deterministic. Changelog belongs in full DB exports only.
    adminChangelog: [],
  };
}
