interface LPBadgeProps {
  credits: number;
}

export function LPBadge({ credits }: LPBadgeProps) {
  return (
    <span className="inline-grid h-[1.875rem] w-[1.875rem] shrink-0 place-items-center rounded-full bg-[#3D3D3D] text-white">
      <span className="mt-[1px] flex flex-col items-center leading-none">
        <span className="text-sm font-semibold">{credits}</span>
      </span>
    </span>
  );
}
