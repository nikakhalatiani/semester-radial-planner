/* eslint-disable @typescript-eslint/no-unused-vars */
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

export class FirebaseAdapter implements StorageAdapter {
  private unsupported(): never {
    throw new Error('FirebaseAdapter is a v2 stub. Use IndexedDBAdapter in v1.');
  }

  public initialize(): Promise<void> {
    this.unsupported();
  }

  public getCourseDefinitions(): Promise<CourseDefinition[]> {
    this.unsupported();
  }

  public saveCourseDefinition(_course: CourseDefinition): Promise<void> {
    this.unsupported();
  }

  public deleteCourseDefinition(_id: string): Promise<void> {
    this.unsupported();
  }

  public getOfferings(_year: number, _semester: SemesterType): Promise<CourseOffering[]> {
    this.unsupported();
  }

  public getAllOfferings(): Promise<CourseOffering[]> {
    this.unsupported();
  }

  public saveOffering(_offering: CourseOffering): Promise<void> {
    this.unsupported();
  }

  public deleteOffering(_id: string): Promise<void> {
    this.unsupported();
  }

  public getPlans(): Promise<UserPlan[]> {
    this.unsupported();
  }

  public savePlan(_plan: UserPlan): Promise<void> {
    this.unsupported();
  }

  public deletePlan(_id: string): Promise<void> {
    this.unsupported();
  }

  public getProgramRules(): Promise<MastersProgramRule[]> {
    this.unsupported();
  }

  public saveProgramRule(_rule: MastersProgramRule): Promise<void> {
    this.unsupported();
  }

  public deleteProgramRule(_id: string): Promise<void> {
    this.unsupported();
  }

  public getProfessors(): Promise<Professor[]> {
    this.unsupported();
  }

  public saveProfessor(_professor: Professor): Promise<void> {
    this.unsupported();
  }

  public deleteProfessor(_id: string): Promise<void> {
    this.unsupported();
  }

  public getUniversities(): Promise<University[]> {
    this.unsupported();
  }

  public saveUniversity(_university: University): Promise<void> {
    this.unsupported();
  }

  public deleteUniversity(_id: string): Promise<void> {
    this.unsupported();
  }

  public getAdminChangelog(): Promise<AdminChangelogEntry[]> {
    this.unsupported();
  }

  public saveAdminChangelogEntry(_entry: AdminChangelogEntry): Promise<void> {
    this.unsupported();
  }

  public exportDatabase(): Promise<SeedData> {
    this.unsupported();
  }

  public importDatabase(_payload: SeedData): Promise<void> {
    this.unsupported();
  }
}
