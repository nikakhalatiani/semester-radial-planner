import type { AdminChangelogEntry } from '../../types';

interface ChangelogViewProps {
  logs: AdminChangelogEntry[];
}

export function ChangelogView({ logs }: ChangelogViewProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <h4 className="text-sm font-semibold">Changelog</h4>
      <div className="max-h-36 space-y-2 overflow-y-auto text-xs">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg bg-surface px-2 py-1">
            <p className="font-medium">{log.diffSummary}</p>
            <p className="text-text-secondary">
              {log.changedAt} • {log.changedBy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
