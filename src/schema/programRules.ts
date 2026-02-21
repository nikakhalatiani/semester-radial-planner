import { z } from 'zod';

export const categoryRequirementSchema = z.object({
  category: z.enum(['FM', 'SE', 'HCI', 'DB', 'DS', 'SS']),
  minCredits: z.number().min(0),
  maxCredits: z.number().min(0).optional(),
  label: z.string().optional(),
});

export const mastersProgramRuleSchema = z.object({
  id: z.string().min(1),
  programName: z.string().min(1),
  version: z.string().min(1),
  totalCreditsRequired: z.number().min(1),
  mandatoryCourseDefinitionIds: z.array(z.string()),
  categoryRequirements: z.array(categoryRequirementSchema),
  seminarMinCount: z.number().min(0),
  praktikumMinCount: z.number().min(0),
  thesisRequired: z.boolean(),
  electiveCreditsMin: z.number().min(0),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

export const programRuleListSchema = z.array(mastersProgramRuleSchema);
