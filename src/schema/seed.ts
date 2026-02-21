import { z } from 'zod';

import { courseDefinitionListSchema } from './course';
import { offeringListSchema } from './offering';
import { userPlanListSchema } from './plan';
import { professorListSchema } from './professor';
import { programRuleListSchema } from './programRules';
import { universityListSchema } from './university';

export const adminChangelogEntrySchema = z.object({
  id: z.string().min(1),
  entityType: z.enum([
    'universities',
    'professors',
    'courseDefinitions',
    'courseOfferings',
    'userPlans',
    'programRules',
  ]),
  entityId: z.string().min(1),
  action: z.enum(['create', 'update', 'delete', 'import']),
  changedAt: z.string().min(1),
  changedBy: z.string().min(1),
  diffSummary: z.string().min(1),
});

export const seedDataSchema = z.object({
  universities: universityListSchema,
  professors: professorListSchema,
  courseDefinitions: courseDefinitionListSchema,
  courseOfferings: offeringListSchema,
  userPlans: userPlanListSchema,
  programRules: programRuleListSchema,
  adminChangelog: z.array(adminChangelogEntrySchema),
});

export type SeedDataInput = z.infer<typeof seedDataSchema>;
