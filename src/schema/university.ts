import { z } from 'zod';

export const universitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortCode: z.string().min(1),
  city: z.string().min(1),
  color: z.string().optional(),
});

export const universityListSchema = z.array(universitySchema);
