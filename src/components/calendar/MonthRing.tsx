interface MonthRingProps {
  radius: number;
  index: number;
}

export function MonthRing({ radius, index }: MonthRingProps) {
  const opacity = index % 2 === 0 ? 0.06 : 0.1;

  return (
    <circle
      cx={400}
      cy={400}
      r={radius}
      fill="none"
      stroke={`rgba(125,125,130,${opacity})`}
      strokeWidth={9}
    />
  );
}
