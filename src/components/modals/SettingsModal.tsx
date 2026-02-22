import { BottomSheet } from '../ui/BottomSheet';
import { Dropdown } from '../ui/Dropdown';

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
  const languageOptions: Array<{ value: 'en' | 'de'; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <label className="block text-sm">
          Language
          <Dropdown
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={language}
            options={languageOptions}
            onChange={onLanguageChange}
          />
        </label>

        <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600">
          Theme is fixed to light for readability.
        </p>
      </div>
    </BottomSheet>
  );
}
