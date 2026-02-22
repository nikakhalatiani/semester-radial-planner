interface PflichtBarProps {
  label: string;
}

export function PflichtBar({ label }: PflichtBarProps) {
  return (
    <div className="mt-3 rounded bg-[#3D3D3D] py-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white">
      {label}
    </div>
  );
}
