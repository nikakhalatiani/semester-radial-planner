export type CourseCategory = 'FM' | 'SE' | 'HCI' | 'DB' | 'DS' | 'SS';

export type SemesterType = 'winter' | 'summer';

export type ExamType = 'written' | 'oral' | 'project';

export type AppMode = 'full' | 'planning' | 'archive';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface University {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  color?: string;
}

export interface Professor {
  id: string;
  name: string;
  universityId: string;
  email?: string;
  isActive: boolean;
}

export interface CourseDefinition {
  id: string;
  name: string;
  shortCode: string;
  category?: CourseCategory;
  isMandatory: boolean;
  isSeminar: boolean;
  credits: number;
  universityId?: string;
  professorIds: string[];
  color: string;
  description?: string;
  isArchived: boolean;
  tags?: string[];
}

export interface ExamOption {
  id: string;
  type: ExamType;
  date: string;
  reexamDate?: string;
  location?: string;
  isDefault: boolean;
}

export interface LectureSession {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
}

export interface CourseOffering {
  id: string;
  courseDefinitionId: string;
  academicYear: number;
  semesterType: SemesterType;
  isAvailable: boolean;
  startDate: string;
  endDate: string;
  lectureSessions?: LectureSession[];
  lectureDates?: string[];
  examOptions: ExamOption[];
  notes?: string;
  professorIds?: string[];
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

export interface SelectedOffering {
  offeringId: string;
  selectedExamOptionId: string;
  isIncluded: boolean;
  displayOrder: number;
}

export interface UserPlan {
  id: string;
  name: string;
  academicYear: number;
  semesterType: SemesterType;
  programRuleId: string;
  selectedOfferings: SelectedOffering[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequirement {
  category: CourseCategory;
  minCredits: number;
  maxCredits?: number;
  label?: string;
}

export interface MastersProgramRule {
  id: string;
  programName: string;
  version: string;
  totalCreditsRequired: number;
  mandatoryCourseDefinitionIds: string[];
  categoryRequirements: CategoryRequirement[];
  seminarMinCount: number;
  praktikumMinCount: number;
  thesisRequired: boolean;
  electiveCreditsMin: number;
  isActive: boolean;
  notes?: string;
}

export interface AppSettings {
  theme: ThemeMode;
  defaultView: AppMode;
  activePlanId?: string;
  activeProgramRuleId: string;
  language: 'en' | 'de';
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'superadmin' | 'editor';
  createdAt: string;
}

export interface AdminChangelogEntry {
  id: string;
  entityType:
    | 'universities'
    | 'professors'
    | 'courseDefinitions'
    | 'courseOfferings'
    | 'userPlans'
    | 'programRules';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'import';
  changedAt: string;
  changedBy: string;
  diffSummary: string;
}

export interface AdminSession {
  token: string;
  email: string;
  role: 'superadmin' | 'editor';
}

export interface SeedData {
  universities: University[];
  professors: Professor[];
  courseDefinitions: CourseDefinition[];
  courseOfferings: CourseOffering[];
  userPlans: UserPlan[];
  programRules: MastersProgramRule[];
  adminChangelog: AdminChangelogEntry[];
}

export interface RuleStatus {
  id: string;
  label: string;
  met: boolean;
  details?: string;
}

export interface RuleEvaluationResult {
  applicableCredits: number;
  metRequirements: number;
  totalRequirements: number;
  rows: RuleStatus[];
}

export interface RadialDisplayOffering {
  offering: CourseOffering;
  definition: CourseDefinition;
  selectedExamOption?: ExamOption;
  displayOrder: number;
}
