import { motion } from 'framer-motion';

import type { CourseDefinition, CourseOffering, ExamOption } from '../../types';
import { ExamDot } from './ExamDot';

interface CourseArcProps {
  path: string;
  definition: CourseDefinition;
  offering: CourseOffering;
  selectedExamOption?: ExamOption;
  examPoint: { x: number; y: number };
  examAnchorPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  examGuidePath?: string;
  midtermPoint?: { x: number; y: number };
  onSelect: () => void;
  onHover: (event: React.MouseEvent<SVGGElement>) => void;
  onLeave: () => void;
}

export function CourseArc({
  path,
  definition,
  offering,
  selectedExamOption,
  examPoint,
  examAnchorPoint,
  endPoint,
  examGuidePath,
  midtermPoint,
  onSelect,
  onHover,
  onLeave,
}: CourseArcProps) {
  const examType = selectedExamOption?.type ?? 'written';

  return (
    <motion.g
      role="button"
      tabIndex={0}
      aria-label={`${definition.name} ${offering.academicYear} ${offering.semesterType}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseMove={onHover}
      onMouseLeave={onLeave}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSelect();
        }
      }}
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ opacity: 1, pathLength: 1 }}
      transition={{ duration: 0.35 }}
      className="cursor-pointer"
    >
      <motion.path
        d={path}
        fill="none"
        stroke={definition.color}
        strokeLinecap="round"
        strokeWidth={7}
        whileHover={{ opacity: 1 }}
        initial={{ opacity: 0.9 }}
      />

      {examGuidePath ? (
        <path
          d={examGuidePath}
          fill="none"
          stroke={definition.color}
          strokeWidth={1.6}
          strokeDasharray="4 4"
          opacity={0.7}
        />
      ) : null}

      <line
        x1={examAnchorPoint.x}
        y1={examAnchorPoint.y}
        x2={examPoint.x}
        y2={examPoint.y}
        stroke={definition.color}
        strokeWidth={1.5}
        opacity={0.7}
      />

      <circle cx={endPoint.x} cy={endPoint.y} r={2.8} fill={definition.color} />
      <ExamDot type={examType} x={examPoint.x} y={examPoint.y} color={definition.color} />

      {selectedExamOption?.reexamDate ? (
        <ExamDot type={examType} x={examPoint.x + 12} y={examPoint.y + 12} color={definition.color} reexam />
      ) : null}

      {midtermPoint ? <circle cx={midtermPoint.x} cy={midtermPoint.y} r={5} fill={definition.color} opacity={0.7} /> : null}
    </motion.g>
  );
}
