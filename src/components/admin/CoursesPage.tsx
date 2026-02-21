import { useState } from 'react';

import type { CourseDefinition, Professor, University } from '../../types';
import { CategoryBadge } from '../ui/CategoryBadge';
import { CourseEditModal } from './CourseEditModal';

interface CoursesPageProps {
  courses: CourseDefinition[];
  universities: University[];
  professors: Professor[];
  canEdit: boolean;
  onSave: (definition: CourseDefinition) => Promise<void>;
  onDelete: (courseId: string) => Promise<void>;
}

export function CoursesPage({
  courses,
  universities,
  professors,
  canEdit,
  onSave,
  onDelete,
}: CoursesPageProps) {
  const [editing, setEditing] = useState<CourseDefinition | undefined>();
  const [open, setOpen] = useState(false);
  const [modalVersion, setModalVersion] = useState(0);

  const openNew = () => {
    setEditing(undefined);
    setModalVersion((prev) => prev + 1);
    setOpen(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Definitions</h3>
        <button
          type="button"
          onClick={openNew}
          disabled={!canEdit}
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add Course
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border dark:border-border-dark">
        <table className="min-w-full divide-y divide-border text-sm dark:divide-border-dark">
          <thead className="bg-surface dark:bg-surface-dark">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">LP</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-3 py-2">{course.name}</td>
                <td className="px-3 py-2">
                  <CategoryBadge category={course.category} color={course.color} />
                </td>
                <td className="px-3 py-2">{course.credits}</td>
                <td className="px-3 py-2">{course.isArchived ? 'Archived' : 'Active'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="rounded-lg border border-border px-2 py-1 text-xs dark:border-border-dark"
                    onClick={() => {
                      setEditing(course);
                      setModalVersion((prev) => prev + 1);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="ml-2 rounded-lg border border-border px-2 py-1 text-xs dark:border-border-dark"
                    onClick={() => void onSave({ ...course, isArchived: !course.isArchived })}
                  >
                    {course.isArchived ? 'Restore' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="ml-2 rounded-lg border border-danger px-2 py-1 text-xs text-danger disabled:opacity-50"
                    onClick={() => void onDelete(course.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CourseEditModal
        key={`${editing?.id ?? 'new'}-${modalVersion}`}
        open={open}
        initial={editing}
        universities={universities}
        professors={professors}
        onClose={() => setOpen(false)}
        onSave={onSave}
      />
    </section>
  );
}
