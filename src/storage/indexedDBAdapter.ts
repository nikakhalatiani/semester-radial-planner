import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import seedJson from '../data/seed.json';
import { courseOfferingSchema } from '../schema/offering';
import { seedDataSchema } from '../schema/seed';
import type {
  AdminChangelogEntry,
  CourseDefinition,
  CourseOffering,
  MastersProgramRule,
  Professor,
  SeedData,
  SemesterType,
  University,
  UserPlan,
} from '../types';
import {
  isAllowedAcademicYear,
  isSemesterAllowedForYear,
  normalizeAcademicYear,
  normalizeSemesterForYear,
} from '../utils/academicYears';
import { resolveProgramSemester } from '../utils/programSemester';
import { getDevSeedOverride } from '../utils/devSeed';

import type { StorageAdapter } from './adapter';

const DB_NAME = 'semester-radial-planner-db';
const DB_VERSION = 1;

function normalizeLegacyMidterms(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const base = payload as Record<string, unknown>;
  const courseOfferings = base.courseOfferings;
  if (!Array.isArray(courseOfferings)) {
    return payload;
  }

  const normalizedOfferings = courseOfferings.map((offeringValue) => {
    if (!offeringValue || typeof offeringValue !== 'object') {
      return offeringValue;
    }

    const offering = { ...(offeringValue as Record<string, unknown>) };
    const midtermDate = typeof offering.midtermDate === 'string' ? offering.midtermDate : undefined;
    const offeringId = typeof offering.id === 'string' ? offering.id : `offering-${Date.now()}`;
    const examOptions = Array.isArray(offering.examOptions) ? [...offering.examOptions] : [];
    const lectureSessions = Array.isArray(offering.lectureSessions)
      ? [...offering.lectureSessions]
      : [];
    const lectureDates = Array.isArray(offering.lectureDates)
      ? [...offering.lectureDates]
      : [];

    const normalizedExamOptions = examOptions
      .map((optionValue, index) => {
        if (!optionValue || typeof optionValue !== 'object') {
          return undefined;
        }

        const option = optionValue as Record<string, unknown>;
        const optionType = typeof option.type === 'string' ? option.type : 'written';
        const mappedType =
          optionType === 'midterm' ? 'written' : optionType === 'none' ? undefined : optionType;

        if (!mappedType || !['written', 'oral', 'project'].includes(mappedType)) {
          return undefined;
        }

        const date = typeof option.date === 'string' && option.date ? option.date : midtermDate;
        if (!date) {
          return undefined;
        }

        return {
          id: typeof option.id === 'string' && option.id ? option.id : `${offeringId}-exam-${index}`,
          type: mappedType as 'written' | 'oral' | 'project',
          date,
          reexamDate:
            typeof option.reexamDate === 'string' && option.reexamDate ? option.reexamDate : undefined,
          location: typeof option.location === 'string' ? option.location : undefined,
          isDefault: Boolean(option.isDefault),
        };
      })
      .filter((option): option is NonNullable<typeof option> => Boolean(option));

    if (normalizedExamOptions.length === 0 && midtermDate) {
      normalizedExamOptions.push({
        id: `${offeringId}-exam-legacy-midterm`,
        type: 'written',
        date: midtermDate,
        reexamDate: undefined,
        location: undefined,
        isDefault: true,
      });
    }

    if (normalizedExamOptions.length > 0 && !normalizedExamOptions.some((option) => option.isDefault)) {
      normalizedExamOptions[0] = { ...normalizedExamOptions[0], isDefault: true };
    }

    let foundDefault = false;
    offering.examOptions = normalizedExamOptions.map((option) => {
      if (!foundDefault && option.isDefault) {
        foundDefault = true;
        return option;
      }

      return { ...option, isDefault: false };
    });

    if (lectureSessions.length === 0 && lectureDates.length > 0) {
      offering.lectureSessions = lectureDates.map((date, index) => ({
        id: `${offeringId}-lecture-session-${index}`,
        date,
      }));
    } else {
      offering.lectureSessions = lectureSessions;
    }
    offering.lectureDates =
      Array.isArray(offering.lectureSessions)
        ? offering.lectureSessions
            .map((session) => {
              if (!session || typeof session !== 'object') {
                return undefined;
              }
              const entry = session as Record<string, unknown>;
              return typeof entry.date === 'string' ? entry.date : undefined;
            })
            .filter((date): date is string => Boolean(date))
        : lectureDates;

    delete offering.midtermDate;
    return offering;
  });

  return {
    ...base,
    courseOfferings: normalizedOfferings,
  };
}

function normalizeOfferingYear(offering: CourseOffering): CourseOffering {
  const normalizedYear = normalizeAcademicYear(offering.academicYear);
  const normalizedSemester = normalizeSemesterForYear(normalizedYear, offering.semesterType);
  return {
    ...offering,
    academicYear: normalizedYear,
    semesterType: normalizedSemester,
    programSemester: resolveProgramSemester(offering.programSemester, normalizedYear, normalizedSemester),
  };
}

function normalizePlanYear(plan: UserPlan): UserPlan {
  const normalizedYear = normalizeAcademicYear(plan.academicYear);
  const normalizedSemester = normalizeSemesterForYear(normalizedYear, plan.semesterType);
  return {
    ...plan,
    academicYear: normalizedYear,
    semesterType: normalizedSemester,
    programSemester: resolveProgramSemester(plan.programSemester, normalizedYear, normalizedSemester),
  };
}

function filterSeedToAllowedYears(seed: SeedData): SeedData {
  const courseOfferings = seed.courseOfferings
    .filter(
      (offering) =>
        isAllowedAcademicYear(offering.academicYear) &&
        isSemesterAllowedForYear(offering.academicYear, offering.semesterType),
    )
    .map((offering) => normalizeOfferingYear(offering));
  const offeringIds = new Set(courseOfferings.map((offering) => offering.id));

  const userPlans = seed.userPlans
    .filter((plan) => isAllowedAcademicYear(plan.academicYear))
    .map((plan) => ({
      ...normalizePlanYear(plan),
      selectedOfferings: plan.selectedOfferings.filter((selection) => offeringIds.has(selection.offeringId)),
    }));

  return {
    ...seed,
    courseOfferings,
    userPlans,
  };
}

interface PlannerDB extends DBSchema {
  universities: {
    key: string;
    value: University;
  };
  professors: {
    key: string;
    value: Professor;
  };
  courseDefinitions: {
    key: string;
    value: CourseDefinition;
  };
  courseOfferings: {
    key: string;
    value: CourseOffering;
  };
  userPlans: {
    key: string;
    value: UserPlan;
  };
  programRules: {
    key: string;
    value: MastersProgramRule;
  };
  adminChangelog: {
    key: string;
    value: AdminChangelogEntry;
  };
}

export class IndexedDBAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBPDatabase<PlannerDB>>;

  public constructor() {
    this.dbPromise = openDB<PlannerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('universities')) {
          db.createObjectStore('universities', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('professors')) {
          db.createObjectStore('professors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('courseDefinitions')) {
          db.createObjectStore('courseDefinitions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('courseOfferings')) {
          db.createObjectStore('courseOfferings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('userPlans')) {
          db.createObjectStore('userPlans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('programRules')) {
          db.createObjectStore('programRules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('adminChangelog')) {
          db.createObjectStore('adminChangelog', { keyPath: 'id' });
        }
      },
    });
  }

  public async initialize(): Promise<void> {
    const db = await this.dbPromise;
    const hasCourseDefinitions = (await db.count('courseDefinitions')) > 0;
    if (!hasCourseDefinitions) {
      const overrideSeed = getDevSeedOverride();
      const seed = seedDataSchema.parse(normalizeLegacyMidterms(overrideSeed ?? seedJson));
      await this.importDatabase(seed);
      return;
    }

    const existingOfferings = await db.getAll('courseOfferings');
    const normalized = normalizeLegacyMidterms({ courseOfferings: existingOfferings }) as {
      courseOfferings?: unknown[];
    };

    if (!Array.isArray(normalized.courseOfferings)) {
      return;
    }

    await Promise.all(
      existingOfferings.map(async (offeringValue, index) => {
        if (
          !isAllowedAcademicYear(offeringValue.academicYear) ||
          !isSemesterAllowedForYear(offeringValue.academicYear, offeringValue.semesterType)
        ) {
          await db.delete('courseOfferings', offeringValue.id);
          return;
        }

        const raw = offeringValue as unknown as Record<string, unknown>;
        const needsMidtermMigration = typeof raw.midtermDate === 'string';
        const rawExamOptions = Array.isArray(raw.examOptions) ? raw.examOptions : [];
        const needsExamTypeMigration = rawExamOptions.some((option) => {
          if (!option || typeof option !== 'object') {
            return false;
          }
          const type = (option as Record<string, unknown>).type;
          return type === 'midterm' || type === 'none';
        });
        const lectureDates = Array.isArray(raw.lectureDates) ? raw.lectureDates : [];
        const needsLectureMigration = !Array.isArray(raw.lectureSessions) && lectureDates.length > 0;
        if (!needsMidtermMigration && !needsLectureMigration && !needsExamTypeMigration) {
          return;
        }

        const migrated = courseOfferingSchema.parse(normalized.courseOfferings?.[index]);
        await db.put('courseOfferings', normalizeOfferingYear(migrated));
      }),
    );

    const allowedOfferingIds = new Set(
      existingOfferings
        .filter(
          (offering) =>
            isAllowedAcademicYear(offering.academicYear) &&
            isSemesterAllowedForYear(offering.academicYear, offering.semesterType),
        )
        .map((offering) => offering.id),
    );
    const existingPlans = await db.getAll('userPlans');

    await Promise.all(
      existingPlans.map(async (plan) => {
        if (!isAllowedAcademicYear(plan.academicYear)) {
          await db.delete('userPlans', plan.id);
          return;
        }

        const normalizedPlan = normalizePlanYear(plan);
        const filteredSelections = normalizedPlan.selectedOfferings.filter((selection) =>
          allowedOfferingIds.has(selection.offeringId),
        );
        const semesterAdjusted =
          normalizedPlan.academicYear !== plan.academicYear || normalizedPlan.semesterType !== plan.semesterType;

        if (filteredSelections.length !== normalizedPlan.selectedOfferings.length || semesterAdjusted) {
          await db.put('userPlans', {
            ...normalizedPlan,
            selectedOfferings: filteredSelections,
          });
        }
      }),
    );
  }

  public async getCourseDefinitions(): Promise<CourseDefinition[]> {
    const db = await this.dbPromise;
    return db.getAll('courseDefinitions');
  }

  public async saveCourseDefinition(course: CourseDefinition): Promise<void> {
    const db = await this.dbPromise;
    await db.put('courseDefinitions', course);
  }

  public async deleteCourseDefinition(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('courseDefinitions', id);
  }

  public async getOfferings(year: number, semester: SemesterType): Promise<CourseOffering[]> {
    const db = await this.dbPromise;
    const all = await db.getAll('courseOfferings');
    return all.filter(
      (offering) =>
        isAllowedAcademicYear(offering.academicYear) &&
        isSemesterAllowedForYear(offering.academicYear, offering.semesterType) &&
        offering.academicYear === year &&
        offering.semesterType === semester,
    );
  }

  public async getAllOfferings(): Promise<CourseOffering[]> {
    const db = await this.dbPromise;
    const offerings = await db.getAll('courseOfferings');
    return offerings.filter(
      (offering) =>
        isAllowedAcademicYear(offering.academicYear) &&
        isSemesterAllowedForYear(offering.academicYear, offering.semesterType),
    );
  }

  public async saveOffering(offering: CourseOffering): Promise<void> {
    const db = await this.dbPromise;
    await db.put('courseOfferings', normalizeOfferingYear(offering));
  }

  public async deleteOffering(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('courseOfferings', id);
  }

  public async getPlans(): Promise<UserPlan[]> {
    const db = await this.dbPromise;
    const plans = await db.getAll('userPlans');
    return plans.filter((plan) => isAllowedAcademicYear(plan.academicYear));
  }

  public async savePlan(plan: UserPlan): Promise<void> {
    const db = await this.dbPromise;
    await db.put('userPlans', normalizePlanYear(plan));
  }

  public async deletePlan(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('userPlans', id);
  }

  public async getProgramRules(): Promise<MastersProgramRule[]> {
    const db = await this.dbPromise;
    return db.getAll('programRules');
  }

  public async saveProgramRule(rule: MastersProgramRule): Promise<void> {
    const db = await this.dbPromise;
    await db.put('programRules', rule);
  }

  public async deleteProgramRule(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('programRules', id);
  }

  public async getProfessors(): Promise<Professor[]> {
    const db = await this.dbPromise;
    return db.getAll('professors');
  }

  public async saveProfessor(professor: Professor): Promise<void> {
    const db = await this.dbPromise;
    await db.put('professors', professor);
  }

  public async deleteProfessor(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('professors', id);
  }

  public async getUniversities(): Promise<University[]> {
    const db = await this.dbPromise;
    return db.getAll('universities');
  }

  public async saveUniversity(university: University): Promise<void> {
    const db = await this.dbPromise;
    await db.put('universities', university);
  }

  public async deleteUniversity(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('universities', id);
  }

  public async getAdminChangelog(): Promise<AdminChangelogEntry[]> {
    const db = await this.dbPromise;
    return db.getAll('adminChangelog');
  }

  public async saveAdminChangelogEntry(entry: AdminChangelogEntry): Promise<void> {
    const db = await this.dbPromise;
    await db.put('adminChangelog', entry);
  }

  public async exportDatabase(): Promise<SeedData> {
    const db = await this.dbPromise;
    const [
      universities,
      professors,
      courseDefinitions,
      courseOfferings,
      userPlans,
      programRules,
      adminChangelog,
    ] = await Promise.all([
      db.getAll('universities'),
      db.getAll('professors'),
      db.getAll('courseDefinitions'),
      db.getAll('courseOfferings'),
      db.getAll('userPlans'),
      db.getAll('programRules'),
      db.getAll('adminChangelog'),
    ]);

    return filterSeedToAllowedYears({
      universities,
      professors,
      courseDefinitions,
      courseOfferings,
      userPlans,
      programRules,
      adminChangelog,
    });
  }

  public async importDatabase(payload: SeedData): Promise<void> {
    const seed = filterSeedToAllowedYears(seedDataSchema.parse(normalizeLegacyMidterms(payload)));
    const db = await this.dbPromise;

    const tx = db.transaction(
      [
        'universities',
        'professors',
        'courseDefinitions',
        'courseOfferings',
        'userPlans',
        'programRules',
        'adminChangelog',
      ],
      'readwrite',
    );

    await Promise.all([
      tx.objectStore('universities').clear(),
      tx.objectStore('professors').clear(),
      tx.objectStore('courseDefinitions').clear(),
      tx.objectStore('courseOfferings').clear(),
      tx.objectStore('userPlans').clear(),
      tx.objectStore('programRules').clear(),
      tx.objectStore('adminChangelog').clear(),
    ]);

    await Promise.all([
      ...seed.universities.map((item) => tx.objectStore('universities').put(item)),
      ...seed.professors.map((item) => tx.objectStore('professors').put(item)),
      ...seed.courseDefinitions.map((item) => tx.objectStore('courseDefinitions').put(item)),
      ...seed.courseOfferings.map((item) => tx.objectStore('courseOfferings').put(item)),
      ...seed.userPlans.map((item) => tx.objectStore('userPlans').put(item)),
      ...seed.programRules.map((item) => tx.objectStore('programRules').put(item)),
      ...seed.adminChangelog.map((item) => tx.objectStore('adminChangelog').put(item)),
    ]);

    await tx.done;
  }
}
