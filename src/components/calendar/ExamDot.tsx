import type { ExamType } from '../../types';

interface ExamDotProps {
  type: ExamType;
  x: number;
  y: number;
  color: string;
  reexam?: boolean;
}

export function ExamDot({ type, x, y, color, reexam = false }: ExamDotProps) {
  if (type === 'oral') {
    return (
      <rect
        x={x - 6}
        y={y - 6}
        width={12}
        height={12}
        transform={`rotate(45 ${x} ${y})`}
        fill={color}
        stroke="white"
        strokeWidth={2}
        strokeDasharray={reexam ? '3 2' : undefined}
      />
    );
  }

  return (
    <circle
      cx={x}
      cy={y}
      r={type === 'none' ? 5 : 9}
      fill={color}
      stroke="white"
      strokeWidth={2}
      strokeDasharray={reexam ? '3 2' : undefined}
      opacity={type === 'none' ? 0.7 : 1}
    />
  );
}
