import { z } from 'zod';

export const selectedOfferingSchema = z.object({
  offeringId: z.string().min(1),
  selectedExamOptionId: z.string().min(1),
  isIncluded: z.boolean(),
  displayOrder: z.number().int().min(0),
});

export const userPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  academicYear: z.number().int(),
  semesterType: z.enum(['winter', 'summer']),
  programRuleId: z.string().min(1),
  selectedOfferings: z.array(selectedOfferingSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const userPlanListSchema = z.array(userPlanSchema);
