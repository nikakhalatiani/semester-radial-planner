import { BottomSheet } from '../ui/BottomSheet';
import { Dropdown } from '../ui/Dropdown';
import { useI18n } from '../../hooks/useI18n';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  language: 'en' | 'de';
  onLanguageChange: (language: 'en' | 'de') => void;
}

export function SettingsModal({
  open,
  onClose,
  language,
  onLanguageChange,
}: SettingsModalProps) {
  const { t } = useI18n();
  const languageOptions: Array<{ value: 'en' | 'de'; label: string }> = [
    { value: 'en', label: t('settings.languageEnglish', 'English') },
    { value: 'de', label: t('settings.languageGerman', 'Deutsch') },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={t('settings.title', 'Settings')}>
      <div className="space-y-4">
        <label className="block text-sm">
          {t('settings.language', 'Language')}
          <Dropdown
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={language}
            options={languageOptions}
            onChange={onLanguageChange}
          />
        </label>

        <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600">
          {t('settings.themeNotice', 'Theme is fixed to light for readability.')}
        </p>
      </div>
    </BottomSheet>
  );
}
