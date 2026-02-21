interface RuleRowProps {
  label: string;
  met: boolean;
  details?: string;
}

export function RuleRow({ label, met, details }: RuleRowProps) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={met ? 'text-success' : 'text-warning'}>{met ? '✅' : '⚠️'}</span>
      <div>
        <p className="font-medium text-white">{label}</p>
        {details ? <p className="text-xs text-white/80">{details}</p> : null}
      </div>
    </div>
  );
}
