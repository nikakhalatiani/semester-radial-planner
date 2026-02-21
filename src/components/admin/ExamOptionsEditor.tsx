import type { ExamOption } from '../../types';

interface ExamOptionsEditorProps {
  options: ExamOption[];
  onChange: (options: ExamOption[]) => void;
}

export function ExamOptionsEditor({ options, onChange }: ExamOptionsEditorProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border p-3 dark:border-border-dark">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Exam Options</h4>
        <button
          type="button"
          className="rounded-lg border border-border px-2 py-1 text-xs dark:border-border-dark"
          onClick={() =>
            onChange([
              ...options,
              {
                id: `exam-${Date.now()}`,
                type: 'written',
                date: new Date().toISOString().slice(0, 10),
                isDefault: options.length === 0,
              },
            ])
          }
        >
          Add
        </button>
      </div>

      {options.map((option) => (
        <div key={option.id} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2 dark:border-border-dark">
          <select
            className="h-9 rounded-lg border border-border px-2 text-sm dark:border-border-dark dark:bg-neutral-900"
            value={option.type}
            onChange={(event) =>
              onChange(
                options.map((item) =>
                  item.id === option.id ? { ...item, type: event.target.value as ExamOption['type'] } : item,
                ),
              )
            }
          >
            <option value="written">Written</option>
            <option value="oral">Oral</option>
            <option value="project">Project</option>
            <option value="none">None</option>
          </select>
          <input
            type="date"
            className="h-9 rounded-lg border border-border px-2 text-sm dark:border-border-dark dark:bg-neutral-900"
            value={option.date.slice(0, 10)}
            onChange={(event) =>
              onChange(options.map((item) => (item.id === option.id ? { ...item, date: event.target.value } : item)))
            }
          />
          <input
            type="date"
            className="h-9 rounded-lg border border-border px-2 text-sm dark:border-border-dark dark:bg-neutral-900"
            value={option.reexamDate?.slice(0, 10) ?? ''}
            onChange={(event) =>
              onChange(
                options.map((item) =>
                  item.id === option.id ? { ...item, reexamDate: event.target.value || undefined } : item,
                ),
              )
            }
          />
          <button
            type="button"
            className="rounded-lg border border-danger px-2 py-1 text-xs text-danger"
            onClick={() => onChange(options.filter((item) => item.id !== option.id))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
