import { polarToCartesian } from '../../utils/arcPath';

interface SeasonLabelProps {
  label: string;
  angle: number;
  active?: boolean;
  onSelect?: () => void;
}

export function SeasonLabel({ label, angle, active = false, onSelect }: SeasonLabelProps) {
  const point = polarToCartesian(400, 400, 358, angle);

  return (
    <text
      x={point.x}
      y={point.y}
      textAnchor="middle"
      dominantBaseline="middle"
      className="cursor-pointer fill-neutral-600 text-[14px] font-semibold"
      style={active ? { fill: '#111111' } : undefined}
      onClick={onSelect}
      role="button"
      aria-label={`Focus ${label}`}
    >
      {label}
    </text>
  );
}
