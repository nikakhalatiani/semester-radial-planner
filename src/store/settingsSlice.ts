import type { StateCreator } from 'zustand';

import type { AppSettings, ThemeMode } from '../types';
import type { AppStore } from './index';

export const APP_SETTINGS_KEY = 'srp_app_settings';

export const defaultSettings: AppSettings = {
  theme: 'light',
  defaultView: 'full',
  activePlanId: undefined,
  activeProgramRuleId: 'rule-msc-se-2024',
  language: 'en',
};

export interface SettingsSlice {
  appSettings: AppSettings;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: 'en' | 'de') => void;
  setDefaultView: (view: AppSettings['defaultView']) => void;
  setActiveProgramRuleId: (ruleId: string) => void;
  setActivePlanInSettings: (planId?: string) => void;
}

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsSlice> = (set) => ({
  appSettings: defaultSettings,
  setTheme: (theme) =>
    set((state) => ({
      appSettings: { ...state.appSettings, theme },
    })),
  setLanguage: (language) =>
    set((state) => ({
      appSettings: { ...state.appSettings, language },
    })),
  setDefaultView: (defaultView) =>
    set((state) => ({
      appSettings: { ...state.appSettings, defaultView },
    })),
  setActiveProgramRuleId: (activeProgramRuleId) =>
    set((state) => ({
      appSettings: { ...state.appSettings, activeProgramRuleId },
    })),
  setActivePlanInSettings: (activePlanId) =>
    set((state) => ({
      appSettings: { ...state.appSettings, activePlanId },
    })),
});
