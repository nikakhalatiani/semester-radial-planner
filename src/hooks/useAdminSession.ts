import { useAppStore } from '../store';

export const ADMIN_SESSION_KEY = 'srp_admin_session';
const DEFAULT_ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? DEFAULT_ADMIN_PASSWORD_HASH;

const ADMIN_USERS: Record<string, 'superadmin' | 'editor'> = {
  'superadmin@planner.local': 'superadmin',
  'editor@planner.local': 'editor',
};

async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function useAdminSession() {
  const session = useAppStore((state) => state.adminSession);
  const setSession = useAppStore((state) => state.setAdminSession);

  const canAccess = Boolean(session);

  const login = async (email: string, password: string) => {
    const role = ADMIN_USERS[email.toLowerCase()];
    if (!role) {
      return false;
    }

    const passwordHash = await sha256(password);
    if (passwordHash !== ADMIN_PASSWORD_HASH) {
      return false;
    }

    const token = `session-${Date.now()}`;
    const nextSession = { email: email.toLowerCase(), role, token };
    setSession(nextSession);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession));
    return true;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  return {
    session,
    canAccess,
    login,
    logout,
  };
}

export function loadAdminSessionFromStorage() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { email?: string; role?: 'superadmin' | 'editor'; token?: string };
    if (parsed.email && parsed.role && parsed.token) {
      return { email: parsed.email, role: parsed.role, token: parsed.token };
    }
  } catch {
    return null;
  }

  return null;
}
