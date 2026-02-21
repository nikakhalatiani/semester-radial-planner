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

    const t = (key: keyof typeof en | string) => {
      const value = dictionary[key as keyof typeof dictionary];
      if (typeof value === 'string') {
        return value;
      }
      return key;
    };

    return {
      language,
      t,
    };
  }, [language]);
}
