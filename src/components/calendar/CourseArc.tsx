import { motion } from 'framer-motion';

import type { CourseDefinition, CourseOffering, ExamOption } from '../../types';
import { formatProgramSemesterWithYear } from '../../utils/programSemester';
import { ExamDot } from './ExamDot';

interface CourseArcProps {
  path: string;
  definition: CourseDefinition;
  offering: CourseOffering;
  selectedExamOption?: ExamOption;
  examPoint: { x: number; y: number; angle: number };
  reexamPoint?: { x: number; y: number };
  endPoint: { x: number; y: number };
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
  reexamPoint,
  endPoint,
  onSelect,
  onHover,
  onLeave,
}: CourseArcProps) {
  const examType = selectedExamOption?.type;

  return (
    <motion.g
      role="button"
      tabIndex={0}
      aria-label={`${definition.name} ${formatProgramSemesterWithYear(
        offering.programSemester,
        offering.academicYear,
        offering.semesterType,
      )}`}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
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
      style={{ outline: 'none' }}
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

      <circle cx={endPoint.x} cy={endPoint.y} r={2.8} fill={definition.color} />
      {examType ? <ExamDot type={examType} x={examPoint.x} y={examPoint.y} color={definition.color} /> : null}

      {reexamPoint && examType ? (
        <ExamDot type={examType} x={reexamPoint.x} y={reexamPoint.y} color={definition.color} reexam />
      ) : null}
    </motion.g>
  );
}
