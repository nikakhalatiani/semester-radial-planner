import { z } from 'zod';

export const examOptionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['written', 'oral', 'project', 'none']),
  date: z.string().min(1),
  reexamDate: z.string().optional(),
  location: z.string().optional(),
  isDefault: z.boolean(),
});

export const courseOfferingSchema = z.object({
  id: z.string().min(1),
  courseDefinitionId: z.string().min(1),
  academicYear: z.number().int(),
  semesterType: z.enum(['winter', 'summer']),
  isAvailable: z.boolean(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  examOptions: z.array(examOptionSchema),
  midtermDate: z.string().optional(),
  notes: z.string().optional(),
  professorIds: z.array(z.string()).optional(),
  lastUpdatedAt: z.string().min(1),
  lastUpdatedBy: z.string().min(1),
});

export const offeringListSchema = z.array(courseOfferingSchema);
