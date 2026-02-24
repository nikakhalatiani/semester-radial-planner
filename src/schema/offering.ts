import { z } from 'zod';

export const examOptionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['written', 'oral', 'project']),
  date: z.string().min(1),
  reexamDate: z.string().optional(),
  location: z.string().optional(),
  isDefault: z.boolean(),
});

export const lectureSessionSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const courseOfferingSchema = z.object({
  id: z.string().min(1),
  courseDefinitionId: z.string().min(1),
  academicYear: z.number().int(),
  semesterType: z.enum(['winter', 'summer']),
  programSemester: z.number().int().min(1).max(12).optional(),
  isAvailable: z.boolean(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  lectureSessions: z.array(lectureSessionSchema).optional(),
  lectureDates: z.array(z.string().min(1)).optional(),
  examOptions: z.array(examOptionSchema),
  notes: z.string().optional(),
  professorIds: z.array(z.string()).optional(),
  lastUpdatedAt: z.string().min(1),
  lastUpdatedBy: z.string().min(1),
});

export const offeringListSchema = z.array(courseOfferingSchema);
