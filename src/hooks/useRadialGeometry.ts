import { useMemo } from 'react';

import type { RadialDisplayOffering } from '../types';
import { describeArc, courseRadius, polarToCartesian } from '../utils/arcPath';
import { dateToAngle } from '../utils/dateToAngle';

export interface ComputedArc {
  offeringId: string;
  path: string;
  startAngle: number;
  endAngle: number;
  examAngle: number;
  radius: number;
  color: string;
  endPoint: { x: number; y: number };
  examPoint: { x: number; y: number; angle: number };
  reexamPoint?: { x: number; y: number; angle: number };
}

const CENTER = { x: 400, y: 400 };

interface UseRadialGeometryOptions {
  transformAngle?: (angle: number) => number;
}

export function useRadialGeometry(
  offerings: RadialDisplayOffering[],
  year: number,
  options?: UseRadialGeometryOptions,
) {
  const transformAngle = options?.transformAngle;

  return useMemo(() => {
    return offerings.map((item) => {
      const rawStartAngle = dateToAngle(new Date(item.offering.startDate), year);
      const rawEndAngle = dateToAngle(new Date(item.offering.endDate), year);
      const radius = courseRadius(item.displayOrder);

      const examDate = item.selectedExamOption?.date;
      const rawExamAngle = dateToAngle(new Date(examDate ?? item.offering.endDate), year);

      const startAngle = transformAngle ? transformAngle(rawStartAngle) : rawStartAngle;
      const endAngle = transformAngle ? transformAngle(rawEndAngle) : rawEndAngle;
      const examAngle = transformAngle ? transformAngle(rawExamAngle) : rawExamAngle;

      // Keep markers centered on the exact course radius so dots sit on the painted course path.
      const markerRadius = radius;
      const examPoint = polarToCartesian(CENTER.x, CENTER.y, markerRadius, examAngle);
      const endPoint = polarToCartesian(CENTER.x, CENTER.y, radius, endAngle);
      const reexamPoint = item.selectedExamOption?.reexamDate
        ? (() => {
            const rawReexamAngle = dateToAngle(new Date(item.selectedExamOption.reexamDate), year);
            const reexamAngle = transformAngle ? transformAngle(rawReexamAngle) : rawReexamAngle;
            const point = polarToCartesian(CENTER.x, CENTER.y, markerRadius, reexamAngle);
            return { x: point.x, y: point.y, angle: reexamAngle };
          })()
        : undefined;

      return {
        offeringId: item.offering.id,
        path: describeArc(CENTER.x, CENTER.y, radius, startAngle, endAngle),
        startAngle,
        endAngle,
        examAngle,
        radius,
        color: item.definition.color,
        endPoint: { x: endPoint.x, y: endPoint.y },
        examPoint: { x: examPoint.x, y: examPoint.y, angle: examAngle },
        reexamPoint,
      } satisfies ComputedArc;
    });
  }, [offerings, year, transformAngle]);
}
