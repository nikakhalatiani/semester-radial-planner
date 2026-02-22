import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RuleRowProps {
  label: string;
  met: boolean;
  details?: string;
}

export function RuleRow({ label, met, details }: RuleRowProps) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${met ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}
        aria-hidden="true"
      >
        {met ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{label}</p>
        {details ? <p className="text-xs text-text-secondary">{details}</p> : null}
      </div>
    </div>
  );
}
