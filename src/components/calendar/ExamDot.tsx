import type { ExamType } from '../../types';

interface ExamDotProps {
  type: ExamType;
  x: number;
  y: number;
  color: string;
  reexam?: boolean;
  size?: number;
}

export function ExamDot({ type, x, y, color, reexam = false, size = 1 }: ExamDotProps) {
  const radius = 6 * size;
  const side = 10 * size;
  const halfSide = side / 2;
  const strokeWidth = Math.max(0.9, 1.5 * size);

  if (type === 'oral') {
    return (
      <rect
        x={x - halfSide}
        y={y - halfSide}
        width={side}
        height={side}
        transform={`rotate(45 ${x} ${y})`}
        fill={color}
        stroke="white"
        strokeWidth={strokeWidth}
        strokeDasharray={reexam ? '2.5 2' : undefined}
      />
    );
  }

  if (type === 'project') {
    const projectSide = 11 * size;
    const projectHalfSide = projectSide / 2;

    return (
      <rect
        x={x - projectHalfSide}
        y={y - projectHalfSide}
        width={projectSide}
        height={projectSide}
        fill={color}
        stroke="white"
        strokeWidth={strokeWidth}
        strokeDasharray={reexam ? '2.5 2' : undefined}
      />
    );
  }

  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={color}
      stroke="white"
      strokeWidth={strokeWidth}
      strokeDasharray={reexam ? '2.5 2' : undefined}
      opacity={1}
    />
  );
}
