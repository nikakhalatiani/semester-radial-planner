interface UniversityTagProps {
  code: string;
  label: string;
}

export function UniversityTag({ code, label }: UniversityTagProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-secondary dark:bg-surface-dark dark:text-text-darkSecondary">
      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-text-primary dark:bg-neutral-700 dark:text-text-darkPrimary">
        {code}
      </span>
      {label}
    </span>
  );
}
