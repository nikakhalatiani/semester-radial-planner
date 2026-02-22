import type { StateCreator } from 'zustand';

import type { AdminSession } from '../types';
import type { AppStore } from './index';

export type AdminSection = 'courses' | 'offerings' | 'plans' | 'professors' | 'rules' | 'universities' | 'data';

export interface AdminSlice {
  adminSession: AdminSession | null;
  adminSection: AdminSection;
  setAdminSession: (session: AdminSession | null) => void;
  setAdminSection: (section: AdminSection) => void;
}

export const createAdminSlice: StateCreator<AppStore, [], [], AdminSlice> = (set) => ({
  adminSession: null,
  adminSection: 'courses',
  setAdminSession: (adminSession) => set({ adminSession }),
  setAdminSection: (adminSection) => set({ adminSection }),
});
