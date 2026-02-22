import { useState } from 'react';

import type { AdminChangelogEntry, CourseDefinition, CourseOffering, Professor } from '../../types';
import { deriveLectureDates, getLectureSessions } from '../../utils/lectureSchedule';
import { BottomSheet } from '../ui/BottomSheet';
import { Dropdown, MultiDropdown } from '../ui/Dropdown';
import { ChangelogView } from './ChangelogView';
import { ExamOptionsEditor } from './ExamOptionsEditor';
import { LectureSessionsEditor } from './LectureSessionsEditor';

interface OfferingEditModalProps {
  open: boolean;
  initial?: CourseOffering;
  definitions: CourseDefinition[];
  professors: Professor[];
  changelog: AdminChangelogEntry[];
  year: number;
  semester: 'winter' | 'summer';
  onClose: () => void;
  onSave: (offering: CourseOffering) => Promise<void>;
}

export function OfferingEditModal({
  open,
  initial,
  definitions,
  professors,
  changelog,
  year,
  semester,
  onClose,
  onSave,
}: OfferingEditModalProps) {
  const buildFallback = (): CourseOffering => ({
    id: '',
    courseDefinitionId: definitions[0]?.id ?? '',
    academicYear: year,
    semesterType: semester,
    isAvailable: true,
    startDate: `${year}-${semester === 'winter' ? '10' : '04'}-01`,
    endDate: `${semester === 'winter' ? year + 1 : year}-${semester === 'winter' ? '01' : '07'}-15`,
    lectureSessions: [],
    lectureDates: [],
    examOptions: [
      {
        id: '',
        type: 'written',
        date: `${semester === 'winter' ? year + 1 : year}-${semester === 'winter' ? '02' : '08'}-20`,
        isDefault: true,
      },
    ],
    notes: '',
    professorIds: [],
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: 'admin',
  });

  const [form, setForm] = useState<CourseOffering>(() => {
    const base = initial ?? buildFallback();
    const lectureSessions = getLectureSessions(base);
    return {
      ...base,
      lectureSessions,
      lectureDates: deriveLectureDates(lectureSessions),
    };
  });

  const localChangelog = changelog.filter((log) => log.entityType === 'courseOfferings' && log.entityId === form.id);
  const courseOptions = definitions.map((definition) => ({
    value: definition.id,
    label: definition.name,
  }));
  const professorOptions = professors.map((professor) => ({
    value: professor.id,
    label: professor.name,
  }));

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit Offering' : 'Create Offering'}>
      <div className="space-y-3">
        <label className="block text-sm">
          Course
          <Dropdown
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            value={form.courseDefinitionId}
            options={courseOptions}
            onChange={(courseDefinitionId) => setForm((prev) => ({ ...prev, courseDefinitionId }))}
          />
        </label>

        <div className="grid grid-cols-1 gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) => setForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
            />
            Available
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Start Date
            <input
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={form.startDate.slice(0, 10)}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </label>
          <label className="block text-sm">
            End Date
            <input
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-border px-3"
              value={form.endDate.slice(0, 10)}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </label>
        </div>

        <LectureSessionsEditor
          sessions={form.lectureSessions ?? []}
          defaultStartDate={form.startDate}
          defaultEndDate={form.endDate}
          onChange={(lectureSessions) =>
            setForm((prev) => ({
              ...prev,
              lectureSessions,
              lectureDates: deriveLectureDates(lectureSessions),
            }))
          }
        />

        <label className="block text-sm">
          Professor/Lecturer override
          <MultiDropdown
            className="mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2"
            values={form.professorIds ?? []}
            options={professorOptions}
            onChange={(professorIds) => setForm((prev) => ({ ...prev, professorIds }))}
          />
        </label>

        <ExamOptionsEditor options={form.examOptions} onChange={(examOptions) => setForm((prev) => ({ ...prev, examOptions }))} />

        <label className="block text-sm">
          Notes
          <textarea
            className="mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2"
            value={form.notes ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </label>

        <ChangelogView logs={localChangelog} />

        <button
          type="button"
          className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white"
          onClick={async () => {
            const generatedOfferingId = form.id || `offering-${Date.now()}`;
            const lectureSessions = (form.lectureSessions ?? [])
              .filter((session) => Boolean(session.date))
              .map((session, index) => ({
                ...session,
                id: session.id || `${generatedOfferingId}-lecture-session-${index}`,
              }));
            await onSave({
              ...form,
              id: generatedOfferingId,
              lectureSessions,
              lectureDates: deriveLectureDates(lectureSessions),
              examOptions: form.examOptions.map((option) => ({
                ...option,
                id: option.id || `${generatedOfferingId}-exam-${Math.random().toString(36).slice(2, 8)}`,
              })),
              lastUpdatedAt: new Date().toISOString(),
            });
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </BottomSheet>
  );
}
