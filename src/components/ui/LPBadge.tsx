interface LPBadgeProps {
  credits: number;
}

export function LPBadge({ credits }: LPBadgeProps) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3D3D3D] text-xs font-semibold text-white">
      {credits} LP
    </span>
  );
}
