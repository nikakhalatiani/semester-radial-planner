import clsx from 'clsx';

import { useI18n } from '../../hooks/useI18n';
import type { AppMode } from '../../types';

interface MobileNavBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onSettingsOpen: () => void;
}

export function MobileNavBar({ mode, onModeChange, onSettingsOpen }: MobileNavBarProps) {
  const { t } = useI18n();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-2 pb-safe pt-2 backdrop-blur dark:border-border-dark dark:bg-neutral-950/95 lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 pb-2">
        <button
          type="button"
          className={clsx('rounded-lg py-2 text-xs font-semibold', mode === 'full' ? 'bg-neutral-900 text-white' : 'text-text-secondary')}
          onClick={() => onModeChange('full')}
        >
          {t('nav.calendar')}
        </button>
        <button
          type="button"
          className={clsx(
            'rounded-lg py-2 text-xs font-semibold',
            mode === 'planning' ? 'bg-neutral-900 text-white' : 'text-text-secondary',
          )}
          onClick={() => onModeChange('planning')}
        >
          {t('nav.plan')}
        </button>
        <button
          type="button"
          className={clsx(
            'rounded-lg py-2 text-xs font-semibold',
            mode === 'archive' ? 'bg-neutral-900 text-white' : 'text-text-secondary',
          )}
          onClick={() => onModeChange('archive')}
        >
          {t('nav.archive')}
        </button>
        <button type="button" className="rounded-lg py-2 text-xs font-semibold text-text-secondary" onClick={onSettingsOpen}>
          {t('nav.settings')}
        </button>
      </div>
    </nav>
  );
}
