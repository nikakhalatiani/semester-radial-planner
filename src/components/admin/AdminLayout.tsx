import clsx from 'clsx';

import { useI18n } from '../../hooks/useI18n';
import type { AdminSection } from '../../store/adminSlice';

interface AdminLayoutProps {
  section: AdminSection;
  role: 'superadmin' | 'editor';
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const sections: { id: AdminSection; labelKey: string; fallback: string }[] = [
  { id: 'courses', labelKey: 'admin.sections.courses', fallback: 'Courses' },
  { id: 'offerings', labelKey: 'admin.sections.offerings', fallback: 'Offerings' },
  { id: 'plans', labelKey: 'admin.sections.plans', fallback: 'Archive Plans' },
  { id: 'professors', labelKey: 'admin.sections.professors', fallback: 'Professors/Lecturers' },
  { id: 'rules', labelKey: 'admin.sections.rules', fallback: 'Program Rules' },
  { id: 'universities', labelKey: 'admin.sections.universities', fallback: 'Universities' },
  { id: 'data', labelKey: 'admin.sections.data', fallback: 'Data' },
];

export function AdminLayout({ section, role, onSectionChange, onLogout, children }: AdminLayoutProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
        <aside className="border-b border-border bg-white p-3 lg:w-64 lg:border-b-0 lg:border-r">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            {t('admin.dashboard', 'Admin Dashboard')}
          </h2>
          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={clsx(
                  'rounded-xl px-3 py-2 text-left text-sm font-medium',
                  section === item.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-surface text-text-secondary',
                )}
              >
                {t(item.labelKey, item.fallback)}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {(() => {
                  const active = sections.find((item) => item.id === section);
                  return active ? t(active.labelKey, active.fallback) : '';
                })()}
              </p>
              <p className="text-xs text-text-secondary">
                {t('admin.role', 'Role')}: {role}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm"
              onClick={onLogout}
            >
              {t('admin.logout', 'Logout')}
            </button>
          </div>

          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
