import { useState } from 'react';

import { AdminLayout } from '../components/admin/AdminLayout';
import { CoursesPage } from '../components/admin/CoursesPage';
import { DataPage } from '../components/admin/DataPage';
import { OfferingsPage } from '../components/admin/OfferingsPage';
import { ProfessorsPage } from '../components/admin/ProfessorsPage';
import { ProgramRulesPage } from '../components/admin/ProgramRulesPage';
import { UniversitiesPage } from '../components/admin/UniversitiesPage';
import { useAdminSession } from '../hooks/useAdminSession';
import { useAppStore } from '../store';

export function AdminPage() {
  const {
    universities,
    professors,
    courseDefinitions,
    courseOfferings,
    programRules,
    adminChangelog,
    adminSection,
    setAdminSection,
    archiveYear,
    archiveSemester,
    setArchivePeriod,
    saveUniversity,
    deleteUniversity,
    saveProfessor,
    deleteProfessor,
    saveCourseDefinition,
    deleteCourseDefinition,
    saveOffering,
    deleteOffering,
    saveProgramRule,
    deleteProgramRule,
    exportDatabase,
    importDatabase,
  } = useAppStore((state) => state);

  const { session, login, logout } = useAdminSession();

  const [email, setEmail] = useState('superadmin@planner.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4 dark:bg-neutral-950">
        <form
          className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-5 shadow-panel dark:bg-neutral-900"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await login(email, password);
            if (!ok) {
              setError('Invalid credentials');
              return;
            }
            setError(null);
          }}
        >
          <h1 className="text-xl font-bold">Admin Login</h1>
          <p className="text-sm text-text-secondary dark:text-text-darkSecondary">
            Use `superadmin@planner.local` or `editor@planner.local`
          </p>
          <label className="block text-sm">
            Email
            <input
              type="email"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-950"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 dark:border-border-dark dark:bg-neutral-950"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminLayout section={adminSection} role={session.role} onSectionChange={setAdminSection} onLogout={logout}>
      {adminSection === 'courses' ? (
        <CoursesPage
          courses={courseDefinitions}
          universities={universities}
          professors={professors}
          canEdit={session.role === 'superadmin'}
          onSave={(definition) => saveCourseDefinition(definition, session.email)}
          onDelete={(courseId) => deleteCourseDefinition(courseId, session.email)}
        />
      ) : null}

      {adminSection === 'offerings' ? (
        <OfferingsPage
          year={archiveYear}
          semester={archiveSemester}
          offerings={courseOfferings}
          definitions={courseDefinitions}
          professors={professors}
          changelog={adminChangelog}
          canEdit
          onPeriodChange={setArchivePeriod}
          onSave={(offering) => saveOffering({ ...offering, lastUpdatedBy: session.email }, session.email)}
          onDelete={(offeringId) => deleteOffering(offeringId, session.email)}
        />
      ) : null}

      {adminSection === 'professors' ? (
        <ProfessorsPage
          professors={professors}
          universities={universities}
          canEdit={session.role === 'superadmin'}
          onSave={(professor) => saveProfessor(professor, session.email)}
          onDelete={(professorId) => deleteProfessor(professorId, session.email)}
        />
      ) : null}

      {adminSection === 'rules' ? (
        <ProgramRulesPage
          rules={programRules}
          canEdit={session.role === 'superadmin'}
          onSave={(rule) => saveProgramRule(rule, session.email)}
          onDelete={(ruleId) => deleteProgramRule(ruleId, session.email)}
        />
      ) : null}

      {adminSection === 'universities' ? (
        <UniversitiesPage
          universities={universities}
          canEdit={session.role === 'superadmin'}
          onSave={(university) => saveUniversity(university, session.email)}
          onDelete={(universityId) => deleteUniversity(universityId, session.email)}
        />
      ) : null}

      {adminSection === 'data' ? (
        <DataPage
          canManage={session.role === 'superadmin'}
          onExport={exportDatabase}
          onImport={(payload) => importDatabase(payload, session.email)}
        />
      ) : null}
    </AdminLayout>
  );
}
