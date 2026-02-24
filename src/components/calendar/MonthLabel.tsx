import { polarToCartesian } from '../../utils/arcPath';

interface MonthLabelProps {
  label: string;
  angle: number;
  radius?: number;
  active?: boolean;
  onSelect?: () => void;
}

export function MonthLabel({ label, angle, radius = 314, active = false, onSelect }: MonthLabelProps) {
  const point = polarToCartesian(400, 400, radius, angle);

  return (
    <text
      x={point.x}
      y={point.y}
      textAnchor="middle"
      dominantBaseline="middle"
      className="cursor-pointer fill-neutral-500 text-[11px] font-medium"
      style={active ? { fill: '#101010', fontWeight: 700 } : undefined}
      onClick={onSelect}
      role="button"
      aria-label={`Focus ${label}`}
    >
      {label}
    </text>
  );
}
