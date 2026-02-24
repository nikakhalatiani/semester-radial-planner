import { useMemo } from 'react';

import de from '../i18n/de.json';
import en from '../i18n/en.json';
import { useAppStore } from '../store';

const dictionaries = {
  en,
  de,
} as const;

export function useI18n() {
  const language = useAppStore((state) => state.appSettings.language);

  return useMemo(() => {
    const dictionary = dictionaries[language] ?? dictionaries.en;
    const fallbackDictionary = dictionaries.en;

    const t = (
      key: keyof typeof en | string,
      fallback?: string,
      values?: Record<string, string | number>,
    ) => {
      const value = dictionary[key as keyof typeof dictionary];
      const fallbackValue = fallbackDictionary[key as keyof typeof fallbackDictionary];
      let resolved =
        typeof value === 'string'
          ? value
          : typeof fallbackValue === 'string'
            ? fallbackValue
            : fallback ?? key;

      if (values) {
        Object.entries(values).forEach(([token, tokenValue]) => {
          resolved = resolved.replace(new RegExp(`\\{${token}\\}`, 'g'), String(tokenValue));
        });
      }

      return resolved;
    };

    return {
      language,
      t,
    };
  }, [language]);
}
