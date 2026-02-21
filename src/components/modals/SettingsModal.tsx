import { BottomSheet } from '../ui/BottomSheet';

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
  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <label className="block text-sm">
          Language
          <select
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value as 'en' | 'de')}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </label>

        <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600">
          Theme is fixed to light for readability.
        </p>
      </div>
    </BottomSheet>
  );
}
