interface UniversityTagProps {
  code: string;
  label: string;
  compact?: boolean;
}

export function UniversityTag({ code, label, compact = false }: UniversityTagProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-secondary">
        <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
          {code}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-secondary">
      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
        {code}
      </span>
      {label}
    </span>
  );
}
