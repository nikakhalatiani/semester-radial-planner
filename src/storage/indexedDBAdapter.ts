import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import seedJson from '../data/seed.json';
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

import type { StorageAdapter } from './adapter';

const DB_NAME = 'semester-radial-planner-db';
const DB_VERSION = 1;

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
      const seed = seedDataSchema.parse(seedJson);
      await this.importDatabase(seed);
    }
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
    return all.filter((offering) => offering.academicYear === year && offering.semesterType === semester);
  }

  public async getAllOfferings(): Promise<CourseOffering[]> {
    const db = await this.dbPromise;
    return db.getAll('courseOfferings');
  }

  public async saveOffering(offering: CourseOffering): Promise<void> {
    const db = await this.dbPromise;
    await db.put('courseOfferings', offering);
  }

  public async deleteOffering(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('courseOfferings', id);
  }

  public async getPlans(): Promise<UserPlan[]> {
    const db = await this.dbPromise;
    return db.getAll('userPlans');
  }

  public async savePlan(plan: UserPlan): Promise<void> {
    const db = await this.dbPromise;
    await db.put('userPlans', plan);
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

    return {
      universities,
      professors,
      courseDefinitions,
      courseOfferings,
      userPlans,
      programRules,
      adminChangelog,
    };
  }

  public async importDatabase(payload: SeedData): Promise<void> {
    const seed = seedDataSchema.parse(payload);
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
