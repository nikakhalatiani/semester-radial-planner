interface LPBadgeProps {
  credits: number;
}

export function LPBadge({ credits }: LPBadgeProps) {
  return (
    <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#3D3D3D] px-3 text-xs font-semibold tracking-wide text-white">
      {credits} LP
    </span>
  );
}
