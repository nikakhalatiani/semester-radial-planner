import { z } from 'zod';

export const courseCategorySchema = z.enum(['FM', 'SE', 'HCI', 'DB', 'DS', 'SS']);

export const courseDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortCode: z.string().min(1),
  category: courseCategorySchema.optional(),
  isMandatory: z.boolean(),
  isSeminar: z.boolean(),
  credits: z.number().min(0),
  universityId: z.string().min(1).optional(),
  professorIds: z.array(z.string()),
  color: z.string().min(1),
  description: z.string().optional(),
  isArchived: z.boolean(),
  tags: z.array(z.string()).optional(),
});

export const courseDefinitionListSchema = z.array(courseDefinitionSchema);
