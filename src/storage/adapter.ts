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

export interface StorageAdapter {
  initialize(): Promise<void>;

  getCourseDefinitions(): Promise<CourseDefinition[]>;
  saveCourseDefinition(course: CourseDefinition): Promise<void>;
  deleteCourseDefinition(id: string): Promise<void>;

  getOfferings(year: number, semester: SemesterType): Promise<CourseOffering[]>;
  getAllOfferings(): Promise<CourseOffering[]>;
  saveOffering(offering: CourseOffering): Promise<void>;
  deleteOffering(id: string): Promise<void>;

  getPlans(): Promise<UserPlan[]>;
  savePlan(plan: UserPlan): Promise<void>;
  deletePlan(id: string): Promise<void>;

  getProgramRules(): Promise<MastersProgramRule[]>;
  saveProgramRule(rule: MastersProgramRule): Promise<void>;
  deleteProgramRule(id: string): Promise<void>;

  getProfessors(): Promise<Professor[]>;
  saveProfessor(professor: Professor): Promise<void>;
  deleteProfessor(id: string): Promise<void>;

  getUniversities(): Promise<University[]>;
  saveUniversity(university: University): Promise<void>;
  deleteUniversity(id: string): Promise<void>;

  getAdminChangelog(): Promise<AdminChangelogEntry[]>;
  saveAdminChangelogEntry(entry: AdminChangelogEntry): Promise<void>;

  exportDatabase(): Promise<SeedData>;
  importDatabase(payload: SeedData): Promise<void>;
}
