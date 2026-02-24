import { seedDataSchema } from '../schema/seed';
import type { SeedData } from '../types';

export const DEV_SEED_OVERRIDE_KEY = 'srp_dev_seed_override';

export function getDevSeedOverride(): SeedData | null {
  const raw = localStorage.getItem(DEV_SEED_OVERRIDE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return seedDataSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setDevSeedOverride(seed: SeedData): void {
  localStorage.setItem(DEV_SEED_OVERRIDE_KEY, JSON.stringify(seed));
}

export function clearDevSeedOverride(): void {
  localStorage.removeItem(DEV_SEED_OVERRIDE_KEY);
}

export async function tryWriteSeedFile(seed: SeedData): Promise<void> {
  try {
    await fetch('/__dev/seed/write', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seed),
    });
  } catch {
    // Ignore file-write failures outside dev server.
  }
}
