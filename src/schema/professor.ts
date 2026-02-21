import { z } from 'zod';

export const professorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  universityId: z.string().min(1),
  email: z.string().email().optional(),
  isActive: z.boolean(),
});

export const professorListSchema = z.array(professorSchema);
