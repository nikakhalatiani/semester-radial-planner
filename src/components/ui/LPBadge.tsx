interface LPBadgeProps {
  credits: number;
}

export function LPBadge({ credits }: LPBadgeProps) {
  return (
    <span className="inline-flex h-8 w-[60px] shrink-0 items-center justify-center rounded-full bg-[#3D3D3D] px-2.5 text-xs font-semibold tracking-wide tabular-nums text-white">
      {credits} LP
    </span>
  );
}
