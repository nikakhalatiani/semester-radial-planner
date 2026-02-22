import type { ExamOption } from '../../types';
import { Dropdown } from '../ui/Dropdown';

interface ExamOptionsEditorProps {
  options: ExamOption[];
  onChange: (options: ExamOption[]) => void;
}

function addDays(dateIso: string, days: number): string {
  const base = new Date(dateIso);
  if (Number.isNaN(base.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function ExamOptionsEditor({ options, onChange }: ExamOptionsEditorProps) {
  const examTypeOptions: Array<{ value: ExamOption['type']; label: string }> = [
    { value: 'written', label: 'Written' },
    { value: 'oral', label: 'Oral' },
    { value: 'project', label: 'Project' },
  ];

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Exam Options</h4>
        <button
          type="button"
          className="rounded-lg border border-border px-2 py-1 text-xs"
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

      <p className="text-xs text-text-secondary">
        Retake date is optional and represents the second exam attempt.
      </p>

      {options.map((option) => (
        <div key={option.id} className="space-y-2 rounded-lg border border-border p-2">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label className="text-xs text-text-secondary">
              Exam Type
              <Dropdown
                className="mt-1 h-9 rounded-lg border border-border px-2 text-sm"
                value={option.type}
                options={examTypeOptions}
                onChange={(event) =>
                  onChange(
                    options.map((item) =>
                      item.id === option.id ? { ...item, type: event } : item,
                    ),
                  )
                }
              />
            </label>

            <label className="text-xs text-text-secondary">
              Exam Date
              <input
                type="date"
                className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
                value={option.date.slice(0, 10)}
                onChange={(event) =>
                  onChange(options.map((item) => (item.id === option.id ? { ...item, date: event.target.value } : item)))
                }
              />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {option.reexamDate ? (
              <label className="min-w-[220px] flex-1 text-xs text-text-secondary">
                Retake Date (Optional)
                <input
                  type="date"
                  className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
                  value={option.reexamDate.slice(0, 10)}
                  onChange={(event) =>
                    onChange(
                      options.map((item) =>
                        item.id === option.id ? { ...item, reexamDate: event.target.value || undefined } : item,
                      ),
                    )
                  }
                />
              </label>
            ) : (
              <button
                type="button"
                className="h-9 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary"
                onClick={() =>
                  onChange(
                    options.map((item) =>
                      item.id === option.id
                        ? { ...item, reexamDate: addDays(item.date.slice(0, 10), 14) }
                        : item,
                    ),
                  )
                }
              >
                Add Retake Date
              </button>
            )}

            {option.reexamDate ? (
              <button
                type="button"
                className="h-9 rounded-lg border border-neutral-300 px-3 text-xs text-text-secondary"
                onClick={() =>
                  onChange(
                    options.map((item) => (item.id === option.id ? { ...item, reexamDate: undefined } : item)),
                  )
                }
              >
                Remove Retake
              </button>
            ) : null}

            <button
              type="button"
              className="h-9 rounded-lg border border-danger px-3 text-xs text-danger"
              onClick={() => onChange(options.filter((item) => item.id !== option.id))}
            >
              Remove Option
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
