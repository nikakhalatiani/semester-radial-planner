import { useMemo, useState } from 'react';

import type { LectureSession } from '../../types';
import { Dropdown } from '../ui/Dropdown';

interface LectureSessionsEditorProps {
  sessions: LectureSession[];
  defaultStartDate?: string;
  defaultEndDate?: string;
  onChange: (sessions: LectureSession[]) => void;
}

type RepeatPattern = 'none' | 'daily' | 'weekly' | 'biweekly';

function toDateOnly(value: string | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function sortSessions(a: LectureSession, b: LectureSession) {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) {
    return dateCompare;
  }
  return (a.startTime ?? '').localeCompare(b.startTime ?? '');
}

function expandDates(startDate: string, untilDate: string, repeat: RepeatPattern): string[] {
  const start = new Date(startDate);
  const end = new Date(untilDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const daysStep = repeat === 'daily' ? 1 : repeat === 'weekly' ? 7 : repeat === 'biweekly' ? 14 : 0;
  if (daysStep === 0) {
    return [startDate];
  }

  const cursor = new Date(start);
  const output: string[] = [];
  while (cursor <= end) {
    output.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + daysStep);
  }

  return output;
}

export function LectureSessionsEditor({
  sessions,
  defaultStartDate,
  defaultEndDate,
  onChange,
}: LectureSessionsEditorProps) {
  const [seriesStartDate, setSeriesStartDate] = useState(() => toDateOnly(defaultStartDate));
  const [seriesUntilDate, setSeriesUntilDate] = useState(() => toDateOnly(defaultEndDate || defaultStartDate));
  const [seriesStartTime, setSeriesStartTime] = useState<string>('');
  const [seriesEndTime, setSeriesEndTime] = useState<string>('');
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>('weekly');

  const repeatOptions: Array<{ value: RepeatPattern; label: string }> = useMemo(
    () => [
      { value: 'none', label: 'Once' },
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'biweekly', label: 'Biweekly (every 2 weeks)' },
    ],
    [],
  );

  const generateSeries = () => {
    if (!seriesStartDate) {
      return;
    }

    const targetUntil = repeatPattern === 'none' ? seriesStartDate : seriesUntilDate || seriesStartDate;
    const generatedDates = expandDates(seriesStartDate, targetUntil, repeatPattern);
    const existingKeys = new Set(
      sessions.map((item) => `${item.date}|${item.startTime ?? ''}|${item.endTime ?? ''}`),
    );
    const created: LectureSession[] = [];

    generatedDates.forEach((date, index) => {
      const key = `${date}|${seriesStartTime}|${seriesEndTime}`;
      if (existingKeys.has(key)) {
        return;
      }
      existingKeys.add(key);
      created.push({
        id: `lecture-session-${Date.now()}-${index}`,
        date,
        startTime: seriesStartTime || undefined,
        endTime: seriesEndTime || undefined,
      });
    });

    if (created.length === 0) {
      return;
    }

    onChange([...sessions, ...created].sort(sortSessions));
  };

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Lecture Schedule</h4>
        <button
          type="button"
          className="rounded-lg border border-border px-2 py-1 text-xs"
          onClick={() =>
            onChange(
              [...sessions, { id: `lecture-session-${Date.now()}`, date: '' }].sort(
                sortSessions,
              ),
            )
          }
        >
          Add Session
        </button>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-2">
        <p className="text-xs font-medium text-text-secondary">
          Quick schedule generator
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <label className="min-w-0 text-xs text-text-secondary">
            Start date
            <input
              type="date"
              className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
              value={seriesStartDate}
              onChange={(event) => setSeriesStartDate(event.target.value)}
            />
          </label>

          <label className="min-w-0 text-xs text-text-secondary">
            Start time
            <input
              type="time"
              step={300}
              className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
              value={seriesStartTime}
              onChange={(event) => setSeriesStartTime(event.target.value)}
            />
          </label>

          <label className="min-w-0 text-xs text-text-secondary">
            End time
            <input
              type="time"
              step={300}
              className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
              value={seriesEndTime}
              onChange={(event) => setSeriesEndTime(event.target.value)}
            />
          </label>

          <label className="min-w-0 text-xs text-text-secondary">
            Repeat
            <Dropdown
              className="mt-1 h-9 rounded-lg border border-border px-2 text-sm"
              value={repeatPattern}
              options={repeatOptions}
              onChange={(value) => setRepeatPattern(value)}
            />
          </label>

          <label className="min-w-0 text-xs text-text-secondary">
            Until date
            <input
              type="date"
              className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
              disabled={repeatPattern === 'none'}
              value={seriesUntilDate}
              onChange={(event) => setSeriesUntilDate(event.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="h-9 rounded-lg border border-border px-3 text-xs font-medium"
          onClick={generateSeries}
        >
          Generate Sessions
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-xs text-text-secondary">
          If empty, month view infers weekly lecture days from offering start/end dates.
        </p>
      ) : null}

      {sessions.map((session) => (
        <div
          key={session.id}
          className="grid grid-cols-1 gap-2 rounded-lg border border-border p-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <label className="min-w-0 text-xs text-text-secondary">
            Date
            <input
              type="date"
              className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
              value={session.date.slice(0, 10)}
              onChange={(event) =>
                onChange(
                  sessions
                    .map((item) =>
                      item.id === session.id ? { ...item, date: event.target.value } : item,
                    )
                    .sort(sortSessions),
                )
              }
            />
          </label>
          <label className="min-w-0 text-xs text-text-secondary">
            Start Time
            <input
              type="time"
              className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
              value={session.startTime ?? ''}
              onChange={(event) =>
                onChange(
                  sessions.map((item) =>
                    item.id === session.id ? { ...item, startTime: event.target.value || undefined } : item,
                  ),
                )
              }
            />
          </label>
          <label className="min-w-0 text-xs text-text-secondary">
            End Time
            <input
              type="time"
              className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm"
              value={session.endTime ?? ''}
              onChange={(event) =>
                onChange(
                  sessions.map((item) =>
                    item.id === session.id ? { ...item, endTime: event.target.value || undefined } : item,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            className="h-9 w-full self-end rounded-lg border border-danger px-2 py-2 text-xs font-medium text-danger xl:w-auto"
            onClick={() => onChange(sessions.filter((item) => item.id !== session.id))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
