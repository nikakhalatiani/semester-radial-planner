import clsx from 'clsx';

import type { AdminSection } from '../../store/adminSlice';

interface AdminLayoutProps {
  section: AdminSection;
  role: 'superadmin' | 'editor';
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const sections: { id: AdminSection; label: string }[] = [
  { id: 'courses', label: 'Courses' },
  { id: 'offerings', label: 'Offerings' },
  { id: 'professors', label: 'Professors' },
  { id: 'rules', label: 'Program Rules' },
  { id: 'universities', label: 'Universities' },
  { id: 'data', label: 'Data' },
];

export function AdminLayout({ section, role, onSectionChange, onLogout, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-surface dark:bg-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
        <aside className="border-b border-border bg-white p-3 dark:border-border-dark dark:bg-neutral-900 lg:w-64 lg:border-b-0 lg:border-r">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary dark:text-text-darkSecondary">
            Admin Dashboard
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
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-surface text-text-secondary dark:bg-surface-dark dark:text-text-darkSecondary',
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 dark:border-border-dark dark:bg-neutral-900">
            <div>
              <p className="text-sm font-semibold text-text-primary dark:text-text-darkPrimary">{sections.find((item) => item.id === section)?.label}</p>
              <p className="text-xs text-text-secondary dark:text-text-darkSecondary">Role: {role}</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm dark:border-border-dark"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>

          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
