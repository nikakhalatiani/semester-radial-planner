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
  { id: 'plans', label: 'Archive Plans' },
  { id: 'professors', label: 'Professors/Lecturers' },
  { id: 'rules', label: 'Program Rules' },
  { id: 'universities', label: 'Universities' },
  { id: 'data', label: 'Data' },
];

export function AdminLayout({ section, role, onSectionChange, onLogout, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
        <aside className="border-b border-border bg-white p-3 lg:w-64 lg:border-b-0 lg:border-r">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
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
                    ? 'bg-neutral-900 text-white'
                    : 'bg-surface text-text-secondary',
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">{sections.find((item) => item.id === section)?.label}</p>
              <p className="text-xs text-text-secondary">Role: {role}</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm"
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
